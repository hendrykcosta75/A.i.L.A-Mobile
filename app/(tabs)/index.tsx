import GlassmorphicCard from '@/components/GlassmorphicCard';
import TopicCard from '@/components/TopicCard';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.xl * 3) / 2;

// Define Topic Type
type Topic = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  iconColor: string;
};

const TOPICS: Topic[] = [
  {
    id: '1',
    icon: 'pulse-outline', // Health
    title: 'Saúde',
    description: 'Planejamento e gestão de saúde pública para melhorar o atendimento.',
    iconColor: '#FF6B6B', // Red
  },
  {
    id: '2',
    icon: 'construct-outline', // Infrastructure
    title: 'Obras',
    description: 'Desenvolvimento urbano e manutenção da infraestrutura.',
    iconColor: '#4ECDC4', // Teal
  },
  {
    id: '3',
    icon: 'book-outline', // Education
    title: 'Educação',
    description: 'Políticas educacionais e melhorias nas escolas.',
    iconColor: '#FFE66D', // Yellow/Gold
  },
  {
    id: '4',
    icon: 'leaf-outline', // Environment
    title: 'Ambiente',
    description: 'Sustentabilidade e preservação dos recursos naturais.',
    iconColor: '#95E1D3', // Light Green
  },
  {
    id: '5',
    icon: 'briefcase-outline', // Economy
    title: 'Economia',
    description: 'Desenvolvimento local e geração de empregos.',
    iconColor: '#F7D794', // Light Orange
  },
  {
    id: '6',
    icon: 'shield-checkmark-outline', // Security
    title: 'Segurança',
    description: 'Segurança pública e proteção da cidadania.',
    iconColor: '#FF8A8A', // Pinkish Red
  },
];

const TRENDING_TOPICS = [
  '# Execução orçamentária',
  '# Licitações',
  '# Obras públicas',
  '# Gestão de pessoal',
  '# Fiscalização', // Added for better layout balance
];

export default function HomeScreen() {
  const handleTopicPress = (topic: Topic) => {
    // Navigate to voice screen with pre-selected topic
    router.push('/conversation' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logoPrefeitura.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>
            A.I.L.A - Assistente de Planejamento
          </Text>
        </View>

        {/* Chat Bar */}
        <TouchableOpacity style={styles.chatContainer} onPress={() => router.push('/conversation' as any)}>
          <GlassmorphicCard style={styles.chatCard}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            <Text style={styles.chatPlaceholder}>Converse com a AILA...</Text>
          </GlassmorphicCard>
        </TouchableOpacity>

        {/* Trending Topics (Moved to Top) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Em Alta</Text>
          <View style={styles.trendingTags}>
            {TRENDING_TOPICS.map((topic, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{topic}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Explore Topics Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tópicos</Text>
            <Text style={styles.sectionSubtitle}>Selecione um tema</Text>
          </View>

          <View style={styles.topicsGrid}>
            {TOPICS.map((topic) => (
              <View key={topic.id} style={styles.topicCardWrapper}>
                <TopicCard
                  icon={topic.icon}
                  title={topic.title}
                  description={topic.description}
                  iconColor={topic.iconColor}
                  onPress={() => handleTopicPress(topic)}
                />
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl + 80,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.h2,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  chatContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: 'rgba(30, 30, 46, 0.8)', // Darker chat bar
    borderRadius: BorderRadius.full,
  },
  chatPlaceholder: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.h3,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  trendingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
  },
  tagText: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  topicCardWrapper: {
    width: CARD_WIDTH,
    marginBottom: Spacing.sm,
  },
});
