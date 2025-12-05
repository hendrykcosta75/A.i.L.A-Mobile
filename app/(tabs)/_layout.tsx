import IridescentOrb from '@/components/IridescentOrb';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.backgroundSecondary,
          borderTopWidth: 1,
          borderTopColor: Colors.glassBorder,
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="conversation"
        options={{
          title: '',
          tabBarButton: () => (
            <TouchableOpacity
              style={styles.orbButtonContainer}
              onPress={() => router.navigate('/conversation')}
              activeOpacity={0.8}
            >
              <IridescentOrb state="idle" size={70} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  orbButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
