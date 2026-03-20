import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MainTabParamList } from '../types';
import { colors } from '../lib/colors';
import { DashboardScreen } from '../screens/DashboardScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { ScanMenuScreen } from '../screens/ScanMenuScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
            Dashboard: { active: 'home', inactive: 'home-outline' },
            CheckIn: { active: 'add-circle', inactive: 'add-circle-outline' },
            Scan: { active: 'camera', inactive: 'camera-outline' },
            Progress: { active: 'bar-chart', inactive: 'bar-chart-outline' },
            Profile: { active: 'person', inactive: 'person-outline' },
          };
          const icon = icons[route.name];
          return <Ionicons name={focused ? icon.active : icon.inactive} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ tabBarLabel: 'Log Meal' }} />
      <Tab.Screen name="Scan" component={ScanMenuScreen} options={{ tabBarLabel: 'Scan' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ tabBarLabel: 'Progress' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: { fontSize: 11, fontWeight: '500' },
});
