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

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim());
      // Root layout will redirect to onboarding
    } catch (err: any) {
      Alert.alert('Sign Up Failed', err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#0D1F17', '#1B4332', '#0D1F17']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <LinearGradient colors={Colors.gradients.primary as any} style={styles.logoCircle}>
              <Ionicons name="leaf" size={32} color="#fff" />
            </LinearGradient>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start your health journey today</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Ahmad Fahmi"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

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
                  placeholder="Min. 8 characters"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkHighlight}>Sign in</Text>
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
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 16 },
  backBtn: { padding: 8 },
  logoCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
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
