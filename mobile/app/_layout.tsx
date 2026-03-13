import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Colors } from '../constants/Colors';

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { session, profile, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
    } else if (session && profile && !profile.onboarded) {
      if (!inOnboarding) router.replace('/(onboarding)');
    } else if (session && profile?.onboarded) {
      if (inAuth || inOnboarding) router.replace('/(tabs)');
    }
  }, [session, profile, loading, segments]);

  return null;
}

export default function RootLayout() {
  const { loadSession, loading } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primaryLight} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  splash: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
});
