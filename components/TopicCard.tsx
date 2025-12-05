import { Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TopicCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    onPress?: () => void;
    iconColor?: string;
}

export default function TopicCard({
    icon,
    title,
    description,
    onPress,
    iconColor = Colors.primary
}: TopicCardProps) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.container}>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Ionicons name={icon} size={32} color={iconColor} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>
                    <Text style={styles.description} numberOfLines={4}>
                        {description}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#25283D', // Lighter than #121212 for contrast
        height: 150, // Slightly reduced height
        width: '100%',
        padding: Spacing.md,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerRow: {
        marginBottom: Spacing.sm,
    },
    textContainer: {
        width: '100%',
    },
    title: {
        fontSize: Typography.body, // Further reduced for better fit
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
        lineHeight: 22,
    },
    description: {
        fontSize: Typography.caption,
        color: '#B0B0C0',
        lineHeight: 16,
    },
});
