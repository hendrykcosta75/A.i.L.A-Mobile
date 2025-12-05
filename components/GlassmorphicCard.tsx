import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface GlassmorphicCardProps {
    children: ReactNode;
    style?: ViewStyle;
    disabled?: boolean;
    gradient?: boolean;
}

export default function GlassmorphicCard({
    children,
    style,
    disabled = false,
    gradient = false
}: GlassmorphicCardProps) {
    if (gradient) {
        return (
            <LinearGradient
                colors={disabled ? [Colors.disabled, Colors.disabled] : ['rgba(0, 255, 136, 0.15)', 'rgba(123, 97, 255, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.container, disabled && styles.disabled, style]}
            >
                <BlurView intensity={20} tint="dark" style={styles.blur}>
                    <View style={styles.content}>
                        {children}
                    </View>
                </BlurView>
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.container, disabled && styles.disabled, style]}>
            <BlurView intensity={20} tint="dark" style={styles.blur}>
                <View style={styles.content}>
                    {children}
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        backgroundColor: Colors.glassBackground,
        borderWidth: 1,
        borderColor: Colors.glassBorder,
        ...Shadows.medium,
    },
    disabled: {
        opacity: 0.5,
        backgroundColor: Colors.disabled,
    },
    blur: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
    },
});
