import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { Colors } from '../../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // Navigation handled by root _layout auth guard
    } catch (err: any) {
      Alert.alert('Login Failed', err.message ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#0D1F17', '#1B4332', '#0D1F17']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoWrap}>
            <LinearGradient colors={Colors.gradients.primary as any} style={styles.logoCircle}>
              <Ionicons name="leaf" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.appName}>FahmiFit</Text>
            <Text style={styles.tagline}>Your AI Health Companion</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkHighlight}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  appName: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, height: 48 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: Colors.text, fontSize: 15 },
  eyeBtn: { padding: 4 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 20 },
  linkText: { color: Colors.textMuted, fontSize: 14 },
  linkHighlight: { color: Colors.primaryLight, fontWeight: '600' },
});
