import IridescentOrb from '@/components/IridescentOrb';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import ailaApiService, { Environment } from '@/services/ailaApiService';
import audioService from '@/services/audioService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking';

export default function ConversationScreen() {
    const [state, setState] = useState<ConversationState>('idle');
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [environment, setEnvironment] = useState<Environment>(ailaApiService.getEnvironment());
    const isProcessingRef = useRef(false);
    const playbackCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isRecordingRef = useRef(false); // Track if we're currently recording
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Track the fallback timeout

    // Refs to track current state in async callbacks
    const isCallActiveRef = useRef(isCallActive);
    const isMutedRef = useRef(isMuted);

    // Keep refs in sync with state
    useEffect(() => {
        isCallActiveRef.current = isCallActive;
    }, [isCallActive]);

    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (playbackCheckRef.current) {
                clearInterval(playbackCheckRef.current);
            }
            audioService.cleanup();
        };
    }, []);

    const startCall = async () => {
        try {
            const hasPermission = await audioService.checkPermissions();

            if (!hasPermission) {
                const result = await audioService.requestPermissions();

                if (!result.granted) {
                    Alert.alert(
                        'Permissão Necessária',
                        'Para conversar com a AILA, precisamos de acesso ao microfone.',
                        [
                            { text: 'Cancelar', style: 'cancel', onPress: () => router.back() },
                            { text: 'OK' }
                        ]
                    );
                    return;
                }
            }

            setIsCallActive(true);

            if (!isMuted) {
                // Pass true to force start (bypass isCallActive check since state hasn't updated yet)
                await startListening(true);
            }
        } catch (error) {
            console.error('Error starting call:', error);
            Alert.alert('Erro', 'Não foi possível iniciar a chamada.');
        }
    };

    const endCall = async () => {
        setIsCallActive(false);
        await audioService.cleanup();
        router.back();
    };

    const startListening = async (forceStart = false) => {
        // forceStart bypasses isCallActive check (used when called from startCall before state updates)
        if (isProcessingRef.current || isMuted || (!forceStart && !isCallActive)) return;

        try {
            isProcessingRef.current = true;

            // Show listening state immediately when mic activates
            setState('listening');
            console.log('Conversation: Starting to listen...');

            // VAD Callbacks
            const onSpeechStart = () => {
                console.log('AudioService: Speech detected, continuing to listen...');
                // Already in listening state, just log
            };

            const onSilence = async () => {
                // Only process if we're still recording
                if (isRecordingRef.current) {
                    console.log('Conversation: Silence detected, processing...');
                    // Clear the timeout since we're processing via VAD
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    await processAudio();
                }
            };

            await audioService.startRecording(onSpeechStart, onSilence);
            isRecordingRef.current = true;
            console.log('Conversation: Recording started successfully');
            isProcessingRef.current = false; // Release lock after successful start

            // Fallback timeout in case VAD fails or background noise is constant (15s)
            timeoutRef.current = setTimeout(async () => {
                // Only process if we're still recording
                if (isRecordingRef.current) {
                    console.log('Conversation: Timeout reached, processing...');
                    await processAudio();
                }
            }, 15000);

        } catch (error) {
            console.error('Error starting listening:', error);
            setState('idle');
            isProcessingRef.current = false;
            isRecordingRef.current = false;
        }
    };

    const processAudio = async () => {
        // Guard: Only process if we have an active recording
        if (!isRecordingRef.current) {
            console.log('processAudio called but no active recording, skipping');
            return;
        }

        // Mark recording as stopped immediately to prevent double calls
        isRecordingRef.current = false;

        // Clear timeout if still pending
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        try {
            setState('processing');
            const audioBase64 = await audioService.stopRecording();

            const responseAudio = await ailaApiService.sendAudioToAILA(audioBase64);

            setState('speaking');
            await audioService.playAudio(responseAudio);

            // Clear any existing interval
            if (playbackCheckRef.current) {
                clearInterval(playbackCheckRef.current);
            }

            playbackCheckRef.current = setInterval(async () => {
                const isPlaying = await audioService.isPlaying();
                console.log('Checking playback status:', isPlaying, 'isCallActive:', isCallActiveRef.current, 'isMuted:', isMutedRef.current);
                if (!isPlaying) {
                    if (playbackCheckRef.current) {
                        clearInterval(playbackCheckRef.current);
                        playbackCheckRef.current = null;
                    }
                    setState('idle');
                    isProcessingRef.current = false;
                    console.log('Playback finished, restarting listening...');

                    // Use refs to get current state values
                    if (isCallActiveRef.current && !isMutedRef.current) {
                        console.log('Calling startListening...');
                        setTimeout(() => startListening(true), 500);
                    } else {
                        console.log('Not restarting: isCallActive=', isCallActiveRef.current, 'isMuted=', isMutedRef.current);
                    }
                }
            }, 300);
        } catch (error: any) {
            console.error('Error processing audio:', error);

            if (error.message?.includes('conexão')) {
                Alert.alert(
                    'Sem Conexão',
                    'Não foi possível conectar com a AILA. Verifique sua conexão.',
                    [{ text: 'OK' }]
                );
            }

            setState('idle');
            isProcessingRef.current = false;

            if (isCallActive && !isMuted) {
                setTimeout(() => startListening(true), 1000);
            }
        }
    };

    // Barge-in: Interrupt AI while speaking
    const handleBargeIn = async () => {
        if (state === 'speaking') {
            console.log('Barge-in: Interrupting AI...');

            // Clear playback check interval
            if (playbackCheckRef.current) {
                clearInterval(playbackCheckRef.current);
                playbackCheckRef.current = null;
            }

            // Stop playback
            await audioService.stopPlayback();

            // Start listening immediately
            isProcessingRef.current = false;
            await startListening(true);
        }
    };

    const toggleMute = async () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);

        if (newMutedState) {
            await audioService.cleanup();
            setState('idle');
            isProcessingRef.current = false;
        } else {
            if (isCallActive) {
                await startListening();
            }
        }
    };

    const handleEnvironmentChange = (env: Environment) => {
        setEnvironment(env);
        ailaApiService.setEnvironment(env);
        setShowSettings(false);
        Alert.alert(
            'Ambiente Alterado',
            `Ambiente alterado para: ${env === 'production' ? 'Produção' : 'Teste'}`,
            [{ text: 'OK' }]
        );
    };

    const getStatusText = () => {
        if (!isCallActive) return 'Toque para iniciar conversa';
        if (isMuted) return 'Chamada silenciada';

        switch (state) {
            case 'listening':
                return 'AILA está ouvindo...';
            case 'processing':
                return 'Processando...';
            case 'speaking':
                return 'AILA está falando...';
            default:
                return 'Chamada ativa';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-down" size={28} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>AILA</Text>
                    <Text style={styles.headerSubtitle}>Assistente de Planejamento</Text>
                </View>
                <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
                    <Ionicons name="settings-outline" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* AILA Avatar */}
                <View style={styles.avatarContainer}>
                    <Image
                        source={require('@/assets/images/IA design.png')}
                        style={styles.avatar}
                        contentFit="contain"
                    />
                </View>

                {/* Orb Visualization */}
                <TouchableOpacity
                    onPress={!isCallActive ? startCall : (state === 'speaking' ? handleBargeIn : undefined)}
                    activeOpacity={!isCallActive || state === 'speaking' ? 0.8 : 1}
                    disabled={isCallActive && state !== 'speaking'}
                >
                    <View style={styles.orbContainer}>
                        <IridescentOrb state={isMuted ? 'idle' : state} size={280} />
                    </View>
                </TouchableOpacity>

                {/* Start Button */}
                {!isCallActive && (
                    <TouchableOpacity style={styles.startButton} onPress={startCall}>
                        <Text style={styles.startButtonText}>Iniciar Conversa</Text>
                    </TouchableOpacity>
                )}

                {/* Status Text */}
                <View style={styles.statusContainer}>
                    <Text style={styles.statusText}>{getStatusText()}</Text>
                    {state === 'processing' && (
                        <ActivityIndicator color={Colors.primary} style={styles.loader} />
                    )}
                </View>
            </View>

            {/* Call Controls */}
            {isCallActive && (
                <View style={styles.controls}>
                    <TouchableOpacity
                        style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                        onPress={toggleMute}
                    >
                        <Ionicons
                            name={isMuted ? 'mic-off' : 'mic'}
                            size={28}
                            color={Colors.text}
                        />
                        <Text style={styles.controlLabel}>
                            {isMuted ? 'Ativar' : 'Silenciar'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, styles.endCallButton]}
                        onPress={endCall}
                    >
                        <Ionicons name="call" size={28} color={Colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => { }}
                    >
                        <Ionicons name="volume-high" size={28} color={Colors.text} />
                        <Text style={styles.controlLabel}>Alto-falante</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Settings Modal */}
            <Modal
                visible={showSettings}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSettings(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Configurações</Text>

                        <Text style={styles.modalLabel}>Ambiente da API</Text>

                        <TouchableOpacity
                            style={[
                                styles.environmentOption,
                                environment === 'production' && styles.environmentOptionActive,
                            ]}
                            onPress={() => handleEnvironmentChange('production')}
                        >
                            <Ionicons
                                name={environment === 'production' ? 'radio-button-on' : 'radio-button-off'}
                                size={24}
                                color={environment === 'production' ? Colors.primary : Colors.textSecondary}
                            />
                            <View style={styles.environmentText}>
                                <Text style={styles.environmentTitle}>Produção</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.environmentOption,
                                environment === 'test' && styles.environmentOptionActive,
                            ]}
                            onPress={() => handleEnvironmentChange('test')}
                        >
                            <Ionicons
                                name={environment === 'test' ? 'radio-button-on' : 'radio-button-off'}
                                size={24}
                                color={environment === 'test' ? Colors.primary : Colors.textSecondary}
                            />
                            <View style={styles.environmentText}>
                                <Text style={styles.environmentTitle}>Teste</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowSettings(false)}
                        >
                            <Text style={styles.closeButtonText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.sm,
    },
    settingsButton: {
        padding: Spacing.sm,
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: Typography.h3,
        fontWeight: '700',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: Typography.caption,
        color: Colors.textSecondary,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        marginBottom: Spacing.xl,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    orbContainer: {
        marginVertical: Spacing.lg,
    },
    startButton: {
        marginTop: Spacing.xl,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
    },
    startButtonText: {
        fontSize: Typography.h4,
        fontWeight: '600',
        color: Colors.background,
    },
    statusContainer: {
        alignItems: 'center',
        marginTop: Spacing.lg,
        minHeight: 60,
    },
    statusText: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    loader: {
        marginTop: Spacing.md,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    controlButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 70,
        height: 70,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
    },
    controlButtonActive: {
        backgroundColor: Colors.primary + '30',
        borderColor: Colors.primary,
    },
    endCallButton: {
        backgroundColor: Colors.error,
        borderColor: Colors.error,
        width: 80,
        height: 80,
    },
    controlLabel: {
        fontSize: Typography.caption,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        backgroundColor: Colors.backgroundSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: Typography.h3,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.lg,
    },
    modalLabel: {
        fontSize: Typography.body,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    environmentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        marginBottom: Spacing.md,
    },
    environmentOptionActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10',
    },
    environmentText: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    environmentTitle: {
        fontSize: Typography.body,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: Spacing.xs / 2,
    },
    environmentUrl: {
        fontSize: Typography.caption,
        color: Colors.textSecondary,
    },
    closeButton: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: Typography.body,
        fontWeight: '600',
        color: Colors.background,
    },
});
