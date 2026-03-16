import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { colors } from '../lib/colors';
import { TabNavigator } from './TabNavigator';
import { AIChatScreen } from '../screens/AIChatScreen';
import { MealScannerScreen } from '../screens/MealScannerScreen';
import { BarcodeScannerScreen } from '../screens/BarcodeScannerScreen';
import { WeightLogScreen } from '../screens/WeightLogScreen';
import { SleepScreen } from '../screens/SleepScreen';
import { GroceryListScreen } from '../screens/GroceryListScreen';
import { WhatsAppScreen } from '../screens/WhatsAppScreen';
import { RemindersScreen } from '../screens/RemindersScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { PricingScreen } from '../screens/PricingScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="AIChat" component={AIChatScreen} options={{ title: 'AI Nutritionist' }} />
      <Stack.Screen name="MealScanner" component={MealScannerScreen} options={{ title: 'Meal Scanner', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} options={{ title: 'Barcode Scanner', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="WeightLog" component={WeightLogScreen} options={{ title: 'Weight Log' }} />
      <Stack.Screen name="Sleep" component={SleepScreen} options={{ title: 'Sleep Tracker' }} />
      <Stack.Screen name="GroceryList" component={GroceryListScreen} options={{ title: 'Grocery List' }} />
      <Stack.Screen name="WhatsApp" component={WhatsAppScreen} options={{ title: 'WhatsApp Setup' }} />
      <Stack.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Reminders' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Workout" component={WorkoutScreen} options={{ title: 'Workout' }} />
      <Stack.Screen name="Pricing" component={PricingScreen} options={{ title: 'Upgrade Plan' }} />
    </Stack.Navigator>
  );
}
