import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

export interface AudioPermissionResult {
    granted: boolean;
    canAskAgain: boolean;
}

type SilenceCallback = () => void;
type SpeechStartCallback = () => void;

class AudioService {
    private recording: Audio.Recording | null = null;
    private sound: Audio.Sound | null = null;
    private isRecording = false;

    // VAD Configuration
    // Thresholds might need tuning based on device mic sensitivity
    private readonly SPEECH_THRESHOLD = -45; // dB
    private readonly SILENCE_THRESHOLD = -55; // dB
    private readonly SILENCE_DURATION = 1500; // ms of silence to trigger stop

    private silenceStartTime: number | null = null;
    private isSpeaking = false;

    private onSilence: SilenceCallback | null = null;
    private onSpeechStart: SpeechStartCallback | null = null;

    constructor() {
        this.configureAudio();
    }

    private async configureAudio() {
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                playThroughEarpieceAndroid: false,
            });
        } catch (error) {
            console.error('Error configuring audio session:', error);
        }
    }

    async requestPermissions(): Promise<AudioPermissionResult> {
        try {
            const { status, canAskAgain } = await Audio.requestPermissionsAsync();
            return {
                granted: status === 'granted',
                canAskAgain,
            };
        } catch (error) {
            console.error('Error requesting audio permissions:', error);
            return { granted: false, canAskAgain: false };
        }
    }

    async checkPermissions(): Promise<boolean> {
        try {
            const { status } = await Audio.getPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('Error checking audio permissions:', error);
            return false;
        }
    }

    /**
     * Start recording with VAD integration
     * @param onSpeechStart Called when user starts speaking
     * @param onSilence Called when silence is detected after speech
     */
    async startRecording(onSpeechStart?: SpeechStartCallback, onSilence?: SilenceCallback): Promise<void> {
        try {
            // Cancel existing
            if (this.recording) {
                await this.cancelRecording();
            }

            const { granted } = await this.requestPermissions();
            if (!granted) {
                throw new Error('Microphone permission not granted');
            }

            // Reset VAD state
            this.isSpeaking = false;
            this.silenceStartTime = null;
            this.onSpeechStart = onSpeechStart || null;
            this.onSilence = onSilence || null;

            // Prepare recording with metering (HIGH_QUALITY usually enables metering)
            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync({
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                isMeteringEnabled: true,
            });

            recording.setOnRecordingStatusUpdate(this.handleRecordingStatus);

            this.recording = recording;
            await recording.startAsync();
            this.isRecording = true;
            console.log('AudioService: Recording started (VAD Active)');

        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    private handleRecordingStatus = (status: Audio.RecordingStatus) => {
        if (!status.isRecording || !status.metering) return;

        const amplitude = status.metering; // In dB, typically -160 to 0

        // 1. Detect Speech Start
        if (!this.isSpeaking && amplitude > this.SPEECH_THRESHOLD) {
            console.log('AudioService: Speech Detected');
            this.isSpeaking = true;
            this.silenceStartTime = null;
            if (this.onSpeechStart) this.onSpeechStart();
        }

        // 2. Detect Silence after Speech
        if (this.isSpeaking) {
            if (amplitude < this.SILENCE_THRESHOLD) {
                if (this.silenceStartTime === null) {
                    this.silenceStartTime = Date.now();
                } else {
                    const elapsedSilence = Date.now() - this.silenceStartTime;
                    if (elapsedSilence > this.SILENCE_DURATION) {
                        console.log('AudioService: Silence Detected (Trigger Stop)');
                        // Stop immediately to prevent cutting off if we just poll
                        // Actually, we should trigger the callback to let the UI decide to stop
                        // But to prevent multiple calls, reset internal state
                        this.isSpeaking = false;
                        this.silenceStartTime = null;
                        if (this.onSilence) this.onSilence();
                    }
                }
            } else {
                // Reset silence timer if they speak again
                this.silenceStartTime = null;
            }
        }
    };

    async stopRecording(): Promise<string> {
        try {
            if (!this.recording) throw new Error('No active recording');

            await this.recording.stopAndUnloadAsync();
            const uri = this.recording.getURI();

            // Clean up listener
            this.recording.setOnRecordingStatusUpdate(null);
            this.recording = null;
            this.isRecording = false;

            if (!uri) throw new Error('No recording URI');

            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            await FileSystem.deleteAsync(uri, { idempotent: true });

            return base64;

        } catch (error) {
            console.error('Error stopping recording:', error);
            this.recording = null; // Force reset
            this.isRecording = false;
            throw error;
        }
    }

    async cancelRecording(): Promise<void> {
        try {
            if (this.recording) {
                try {
                    await this.recording.stopAndUnloadAsync();
                } catch (e) { /* Ignore if already stopped */ }
                this.recording = null;
            }
            this.isRecording = false;
        } catch (error) {
            console.error('Error canceling recording:', error);
        }
    }

    async playAudio(base64Audio: string): Promise<void> {
        try {
            await this.stopPlayback();

            const uri = FileSystem.cacheDirectory + 'temp_response.mp3';
            await FileSystem.writeAsStringAsync(uri, base64Audio, {
                encoding: 'base64',
            });

            const { sound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: true }
            );

            this.sound = sound;

            // Cleanup on finish
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    await sound.unloadAsync();
                    this.sound = null;
                }
            });

        } catch (error) {
            console.error('Error playing audio:', error);
            throw error;
        }
    }

    async stopPlayback(): Promise<void> {
        try {
            if (this.sound) {
                await this.sound.stopAsync();
                await this.sound.unloadAsync();
                this.sound = null;
            }
        } catch (error) {
            console.error('Error stopping playback:', error);
        }
    }

    async isPlaying(): Promise<boolean> {
        if (!this.sound) return false;
        try {
            const status = await this.sound.getStatusAsync();
            return status.isLoaded && status.isPlaying;
        } catch {
            return false;
        }
    }

    async cleanup(): Promise<void> {
        await this.cancelRecording();
        await this.stopPlayback();
    }
}

export default new AudioService();
