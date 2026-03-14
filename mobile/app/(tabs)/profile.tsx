import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { updateProfile, calculateCalorieTarget, UserProfile } from '../../lib/database';
import { Colors } from '../../constants/Colors';

const GOALS = [
  { key: 'lose_weight', label: 'Lose Weight', icon: 'trending-down' },
  { key: 'gain_muscle', label: 'Gain Muscle', icon: 'barbell' },
  { key: 'maintain', label: 'Maintain', icon: 'shield-checkmark' },
  { key: 'improve_health', label: 'Improve Health', icon: 'heart' },
] as const;

const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, profile, signOut, refreshProfile } = useAuthStore();
  const [showEdit, setShowEdit] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  // Edit form state (mirrors profile)
  const [form, setForm] = useState<Partial<UserProfile>>({});

  function openEdit() {
    setForm({
      full_name: profile?.full_name ?? '',
      age: profile?.age ?? undefined,
      gender: profile?.gender ?? 'male',
      height_cm: profile?.height_cm ?? undefined,
      weight_kg: profile?.weight_kg ?? undefined,
      goal: profile?.goal ?? 'maintain',
      activity_level: profile?.activity_level ?? 'moderate',
      diet_preference: profile?.diet_preference ?? 'Omnivore',
    });
    setShowEdit(true);
  }

  async function saveProfile() {
    if (!session?.user) return;
    setSaving(true);
    try {
      const calorie_target = calculateCalorieTarget({
        age: form.age,
        gender: form.gender,
        height_cm: form.height_cm,
        weight_kg: form.weight_kg,
        activity_level: form.activity_level,
        goal: form.goal,
      });
      await updateProfile(session.user.id, {
        ...form,
        calorie_target,
        protein_target: Math.round((calorie_target * 0.3) / 4),
        carb_target: Math.round((calorie_target * 0.4) / 4),
        fat_target: Math.round((calorie_target * 0.3) / 9),
      });
      await refreshProfile();
      setShowEdit(false);
    } catch {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function saveWeight() {
    if (!session?.user || !newWeight) return;
    setSaving(true);
    try {
      await updateProfile(session.user.id, { weight_kg: Number(newWeight) });
      await refreshProfile();
      setShowWeightModal(false);
      setNewWeight('');
      Alert.alert('Updated!', `Weight updated to ${newWeight} kg`);
    } catch {
      Alert.alert('Error', 'Failed to update weight.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          setSigningOut(true);
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const bmi = profile?.weight_kg && profile?.height_cm
    ? (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1)
    : null;

  const goal = GOALS.find(g => g.key === profile?.goal);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
          <LinearGradient colors={Colors.gradients.accent as any} style={styles.avatar}>
            <Text style={styles.avatarText}>{(profile?.full_name ?? 'U').charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.name}>{profile?.full_name ?? 'User'}</Text>
          <Text style={styles.email}>{session?.user.email}</Text>
          {goal && (
            <View style={styles.goalChip}>
              <Ionicons name={goal.icon as any} size={14} color={Colors.primaryLight} />
              <Text style={styles.goalChipText}>{goal.label}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Weight', val: profile?.weight_kg ? `${profile.weight_kg} kg` : '—' },
            { label: 'Height', val: profile?.height_cm ? `${profile.height_cm} cm` : '—' },
            { label: 'BMI', val: bmi ?? '—' },
            { label: 'Age', val: profile?.age ? `${profile.age} yr` : '—' },
          ].map(s => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Nutrition Targets */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Targets</Text>
          {[
            { icon: 'flame', label: 'Calories', val: `${profile?.calorie_target ?? 0} kcal`, color: Colors.primaryLight },
            { icon: 'barbell', label: 'Protein', val: `${profile?.protein_target ?? 0}g`, color: Colors.protein },
            { icon: 'nutrition', label: 'Carbs', val: `${profile?.carb_target ?? 0}g`, color: Colors.carbs },
            { icon: 'water', label: 'Fat', val: `${profile?.fat_target ?? 0}g`, color: Colors.fat },
          ].map(t => (
            <View key={t.label} style={styles.targetRow}>
              <Ionicons name={t.icon as any} size={18} color={t.color} />
              <Text style={styles.targetLabel}>{t.label}</Text>
              <Text style={[styles.targetVal, { color: t.color }]}>{t.val}</Text>
            </View>
          ))}
        </View>

        {/* Activity & Diet */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lifestyle</Text>
          <View style={styles.targetRow}>
            <Ionicons name="fitness" size={18} color={Colors.primaryLight} />
            <Text style={styles.targetLabel}>Activity Level</Text>
            <Text style={styles.targetVal}>{(profile?.activity_level ?? 'moderate').replace('_', ' ')}</Text>
          </View>
          <View style={styles.targetRow}>
            <Ionicons name="leaf" size={18} color={Colors.primaryLight} />
            <Text style={styles.targetLabel}>Diet</Text>
            <Text style={styles.targetVal}>{profile?.diet_preference ?? 'Omnivore'}</Text>
          </View>
          <View style={styles.targetRow}>
            <Ionicons name="person" size={18} color={Colors.primaryLight} />
            <Text style={styles.targetLabel}>Gender</Text>
            <Text style={styles.targetVal} style={{ textTransform: 'capitalize' } as any}>{profile?.gender ?? '—'}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowWeightModal(true)}>
            <Ionicons name="scale" size={20} color={Colors.primaryLight} />
            <Text style={styles.actionBtnText}>Log Weight</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/whatsapp')}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.actionBtnText}>WhatsApp Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/progress')}>
            <Ionicons name="trending-up" size={20} color={Colors.sleep} />
            <Text style={styles.actionBtnText}>View Progress</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={signingOut}>
          {signingOut ? <ActivityIndicator color={Colors.danger} size="small" /> : (
            <>
              <Ionicons name="log-out" size={20} color={Colors.danger} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEdit(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
            {[
              { key: 'full_name', label: 'Full Name', placeholder: 'Ahmad Fahmi', type: 'default' },
              { key: 'age', label: 'Age', placeholder: '25', type: 'number-pad' },
              { key: 'height_cm', label: 'Height (cm)', placeholder: '175', type: 'decimal-pad' },
              { key: 'weight_kg', label: 'Weight (kg)', placeholder: '75', type: 'decimal-pad' },
            ].map(f => (
              <View key={f.key}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[f.key as keyof typeof form]?.toString() ?? ''}
                  onChangeText={v => setForm(p => ({ ...p, [f.key]: f.type === 'default' ? v : Number(v) || undefined }))}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType={f.type as any}
                />
              </View>
            ))}

            <Text style={styles.label}>Gender</Text>
            <View style={styles.row}>
              {(['male', 'female', 'other'] as const).map(g => (
                <TouchableOpacity key={g} style={[styles.chip, form.gender === g && styles.chipActive]} onPress={() => setForm(p => ({ ...p, gender: g }))}>
                  <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>{g.charAt(0).toUpperCase() + g.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Goal</Text>
            {GOALS.map(g => (
              <TouchableOpacity key={g.key} style={[styles.optionCard, form.goal === g.key && styles.optionCardActive]} onPress={() => setForm(p => ({ ...p, goal: g.key }))}>
                <Ionicons name={g.icon as any} size={20} color={form.goal === g.key ? Colors.primaryLight : Colors.textMuted} />
                <Text style={[styles.optionLabel, form.goal === g.key && { color: Colors.primaryLight }]}>{g.label}</Text>
                {form.goal === g.key && <Ionicons name="checkmark-circle" size={20} color={Colors.primaryLight} />}
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.row}>
              {ACTIVITY_LEVELS.map(a => (
                <TouchableOpacity key={a} style={[styles.chip, form.activity_level === a && styles.chipActive]} onPress={() => setForm(p => ({ ...p, activity_level: a }))}>
                  <Text style={[styles.chipText, form.activity_level === a && styles.chipTextActive]}>{a.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Log Weight Modal */}
      <Modal visible={showWeightModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.weightModal}>
            <Text style={styles.modalTitle}>Log Weight</Text>
            <Text style={styles.weightCurrent}>Current: {profile?.weight_kg ?? '—'} kg</Text>
            <TextInput
              style={styles.input}
              value={newWeight}
              onChangeText={setNewWeight}
              placeholder="Enter new weight (kg)"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtnModal} onPress={() => setShowWeightModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { flex: 1 }, saving && { opacity: 0.6 }]} onPress={saveWeight} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 24, paddingHorizontal: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 2 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  goalChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  goalChipText: { color: Colors.primaryLight, fontSize: 13, fontWeight: '600' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderTopWidth: 1, borderColor: Colors.border },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: Colors.border },
  statVal: { fontSize: 16, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  card: { margin: 16, marginBottom: 0, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  targetLabel: { flex: 1, color: Colors.textSecondary, fontSize: 14 },
  targetVal: { fontSize: 14, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  actionsCard: { margin: 16, marginBottom: 0, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  actionBtnText: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 48 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.danger + '40' },
  signOutText: { color: Colors.danger, fontSize: 16, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 28, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, height: 48, color: Colors.text, fontSize: 15 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  optionCardActive: { borderColor: Colors.primaryLight, backgroundColor: '#1B4332' },
  optionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  weightModal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  weightCurrent: { color: Colors.textMuted, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtnModal: { flex: 1, backgroundColor: Colors.background, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
});
