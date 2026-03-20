import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { AuthStackParamList } from '../../types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'> };

export function SignupScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) { setError('Please fill all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <View style={styles.root}>
        <View style={styles.successContainer}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </LinearGradient>
          <Text style={styles.successTitle}>Account Created!</Text>
          <Text style={styles.successText}>
            Please check your email to verify your account, then sign in.
          </Text>
          <Button title="Go to Sign In" onPress={() => navigation.navigate('Login')} style={styles.successBtn} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.logoGradient}>
            <Ionicons name="leaf" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>FahmiFit</Text>
          <Text style={styles.tagline}>Start your health journey today</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>It's free to get started</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input label="Full Name" value={name} onChangeText={setName} placeholder="Your name" leftIcon="person-outline" />
          <Input
            label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com"
            keyboardType="email-address" autoCapitalize="none" leftIcon="mail-outline"
          />
          <Input
            label="Password" value={password} onChangeText={setPassword}
            placeholder="Min. 6 characters" isPassword leftIcon="lock-closed-outline"
          />
          <Input
            label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword}
            placeholder="Repeat password" isPassword leftIcon="lock-closed-outline"
          />

          <Button title="Create Account" onPress={handleSignup} loading={loading} style={styles.signupBtn} />
        </View>

        <View style={styles.features}>
          {['AI Nutritionist Chat', 'Meal Scanner', 'WhatsApp Reminders', 'Progress Analytics'].map((f) => (
            <View key={f} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 32, gap: 8 },
  logoGradient: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 28, fontWeight: '800', color: colors.text },
  tagline: { fontSize: 14, color: colors.textMuted },
  card: { backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 24, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  signupBtn: { marginTop: 8 },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, justifyContent: 'center' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { color: colors.textMuted, fontSize: 13 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 20 },
  loginText: { color: colors.textMuted, fontSize: 14 },
  loginLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  successText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  successBtn: { width: '100%' },
});
