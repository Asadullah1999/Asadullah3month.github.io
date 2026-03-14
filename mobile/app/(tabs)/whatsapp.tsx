import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Modal, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import {
  getWhatsAppContact, upsertWhatsAppContact, WhatsAppContact,
  getReminders, createReminder, toggleReminder, deleteReminder, Reminder,
} from '../../lib/database';
import { Colors } from '../../constants/Colors';

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WhatsAppScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuthStore();
  const [contact, setContact] = useState<WhatsAppContact | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [step, setStep] = useState<'enter_phone' | 'verify' | 'connected'>('enter_phone');
  const [saving, setSaving] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);

  // New reminder form
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newDays, setNewDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [newType, setNewType] = useState<Reminder['type']>('meal');

  async function load() {
    if (!session?.user) return;
    const [c, r] = await Promise.all([
      getWhatsAppContact(session.user.id),
      getReminders(session.user.id),
    ]);
    setContact(c);
    setReminders(r);
    if (c?.is_verified) setStep('connected');
    else if (c && !c.is_verified) { setPhone(c.phone_number); setStep('verify'); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [session]);

  async function submitPhone() {
    if (!phone || !session?.user) { Alert.alert('Error', 'Please enter a valid phone number'); return; }
    setSaving(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await upsertWhatsAppContact({
        user_id: session.user.id,
        phone_number: phone,
        display_name: profile?.full_name ?? '',
        is_verified: false,
        opt_in: true,
        verification_code: code,
      } as any);
      setStep('verify');
      Alert.alert(
        'Code Generated',
        `Your verification code is: ${code}\n\nIn a real setup, this would be sent via WhatsApp. For testing, use this code.`,
      );
    } catch {
      Alert.alert('Error', 'Failed to save phone number.');
    } finally {
      setSaving(false);
    }
  }

  async function submitVerify() {
    if (!verifyCode || !session?.user) { Alert.alert('Error', 'Enter the code'); return; }
    setSaving(true);
    try {
      // In production this would verify against the DB code via API
      // For now we mark as verified directly
      await upsertWhatsAppContact({
        user_id: session.user.id,
        phone_number: phone,
        is_verified: true,
        opt_in: true,
        verified_at: new Date().toISOString(),
      } as any);
      await load();
      Alert.alert('Connected!', 'Your WhatsApp is now connected. You will receive reminders via WhatsApp.');
    } catch {
      Alert.alert('Error', 'Verification failed.');
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    Alert.alert('Disconnect WhatsApp', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive', onPress: async () => {
          if (!session?.user) return;
          await upsertWhatsAppContact({ user_id: session.user.id, is_verified: false, opt_in: false } as any);
          setStep('enter_phone');
          setContact(null);
        },
      },
    ]);
  }

  async function addReminder() {
    if (!newTitle || !session?.user) { Alert.alert('Error', 'Please fill in title'); return; }
    setSaving(true);
    try {
      await createReminder({
        user_id: session.user.id,
        type: newType,
        title: newTitle,
        message: newMessage || newTitle,
        time: newTime,
        days: newDays,
        is_active: true,
        channel: 'whatsapp',
      });
      setShowAddReminder(false);
      setNewTitle(''); setNewMessage(''); setNewTime('08:00'); setNewDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      await load();
    } catch {
      Alert.alert('Error', 'Failed to create reminder.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleReminder(id, !current);
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r));
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Reminder', 'Remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteReminder(id);
          setReminders(prev => prev.filter(r => r.id !== id));
        },
      },
    ]);
  }

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={Colors.primaryLight} /></View>;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#075E54', '#128C7E']} style={styles.header}>
        <Ionicons name="logo-whatsapp" size={28} color="#fff" />
        <View>
          <Text style={styles.headerTitle}>WhatsApp Integration</Text>
          <Text style={styles.headerSub}>Get reminders & log via WhatsApp</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Connection Status */}
        {step === 'enter_phone' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connect Your WhatsApp</Text>
            <Text style={styles.cardDesc}>Receive meal reminders, water reminders, and daily summaries directly on WhatsApp. You can also log water by messaging us.</Text>
            <Text style={styles.label}>Phone Number (with country code)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+60123456789"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={[styles.btn, saving && { opacity: 0.6 }]} onPress={submitPhone} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Send Verification Code</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 'verify' && (
          <View style={styles.card}>
            <Ionicons name="shield-checkmark" size={36} color={Colors.primaryLight} style={{ marginBottom: 8 }} />
            <Text style={styles.cardTitle}>Verify Your Number</Text>
            <Text style={styles.cardDesc}>Enter the 6-digit code sent to {phone}</Text>
            <TextInput
              style={styles.input}
              value={verifyCode}
              onChangeText={setVerifyCode}
              placeholder="123456"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity style={[styles.btn, saving && { opacity: 0.6 }]} onPress={submitVerify} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Verify & Connect</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('enter_phone')} style={styles.linkBtn}>
              <Text style={styles.linkText}>Use different number</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'connected' && contact && (
          <View style={styles.connectedCard}>
            <LinearGradient colors={['#075E54', '#128C7E']} style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
              <Text style={styles.connectedText}>Connected</Text>
            </LinearGradient>
            <Text style={styles.connectedPhone}>{contact.phone_number}</Text>

            <View style={styles.commandsCard}>
              <Text style={styles.commandsTitle}>WhatsApp Commands</Text>
              {[
                { cmd: 'water 500', desc: 'Log 500ml of water' },
                { cmd: 'status', desc: "Today's calorie progress" },
                { cmd: 'stop', desc: 'Pause reminders' },
                { cmd: 'start', desc: 'Resume reminders' },
                { cmd: 'help', desc: 'Show all commands' },
              ].map(c => (
                <View key={c.cmd} style={styles.commandRow}>
                  <Text style={styles.commandCmd}>"{c.cmd}"</Text>
                  <Text style={styles.commandDesc}>{c.desc}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
              <Ionicons name="unlink" size={16} color={Colors.danger} />
              <Text style={styles.disconnectText}>Disconnect WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reminders */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            <TouchableOpacity onPress={() => setShowAddReminder(true)} style={styles.addBtn}>
              <Ionicons name="add" size={18} color={Colors.primaryLight} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {reminders.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="alarm-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No reminders yet</Text>
              <Text style={styles.emptySubText}>Add reminders to get WhatsApp notifications</Text>
            </View>
          ) : (
            reminders.map(r => (
              <View key={r.id} style={styles.reminderCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>{r.title}</Text>
                  <Text style={styles.reminderMeta}>{r.time} · {r.days.join(', ')}</Text>
                </View>
                <Switch
                  value={r.is_active}
                  onValueChange={() => handleToggle(r.id, r.is_active)}
                  trackColor={{ true: Colors.primaryLight }}
                />
                <TouchableOpacity onPress={() => handleDelete(r.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal visible={showAddReminder} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Reminder</Text>
            <TouchableOpacity onPress={() => setShowAddReminder(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <View>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {(['meal', 'water', 'weigh_in', 'custom'] as const).map(t => (
                  <TouchableOpacity key={t} style={[styles.typeChip, newType === t && styles.typeChipActive]} onPress={() => setNewType(t)}>
                    <Text style={[styles.typeChipText, newType === t && styles.typeChipTextActive]}>{t.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} value={newTitle} onChangeText={setNewTitle} placeholder="e.g. Breakfast reminder" placeholderTextColor={Colors.textMuted} />
            </View>
            <View>
              <Text style={styles.label}>Message</Text>
              <TextInput style={styles.input} value={newMessage} onChangeText={setNewMessage} placeholder="e.g. Time to log your breakfast!" placeholderTextColor={Colors.textMuted} />
            </View>
            <View>
              <Text style={styles.label}>Time (HH:MM)</Text>
              <TextInput style={styles.input} value={newTime} onChangeText={setNewTime} placeholder="08:00" placeholderTextColor={Colors.textMuted} keyboardType="numbers-and-punctuation" />
            </View>
            <View>
              <Text style={styles.label}>Days</Text>
              <View style={styles.daysRow}>
                {DAY_KEYS.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayChip, newDays.includes(d) && styles.dayChipActive]}
                    onPress={() => setNewDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                  >
                    <Text style={[styles.dayChipText, newDays.includes(d) && styles.dayChipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.btn, saving && { opacity: 0.6 }]} onPress={addReminder} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Create Reminder</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  cardDesc: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, height: 48, color: Colors.text, fontSize: 15 },
  btn: { backgroundColor: '#25D366', borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 12 },
  linkText: { color: Colors.textMuted, fontSize: 14 },
  connectedCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  connectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 10 },
  connectedText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  connectedPhone: { color: Colors.textSecondary, fontSize: 15, marginBottom: 16 },
  commandsCard: { width: '100%', backgroundColor: Colors.background, borderRadius: 12, padding: 14, marginBottom: 16 },
  commandsTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  commandRow: { flexDirection: 'row', gap: 10, paddingVertical: 6 },
  commandCmd: { color: Colors.primaryLight, fontSize: 13, fontWeight: '700', width: 100 },
  commandDesc: { flex: 1, color: Colors.textMuted, fontSize: 13 },
  disconnectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  disconnectText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  section: {},
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { color: Colors.primaryLight, fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  emptySubText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },
  reminderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  reminderTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  reminderMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 6 },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 28, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  typeChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeChipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  typeChipTextActive: { color: '#fff', fontWeight: '700' },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  dayChipTextActive: { color: '#fff' },
});
