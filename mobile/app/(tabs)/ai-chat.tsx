import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { chatWithAI } from '../../lib/api';
import { Colors } from '../../constants/Colors';

type Message = { role: 'user' | 'assistant'; content: string; id: string };

const SUGGESTIONS = [
  'What should I eat for breakfast?',
  'How can I hit my protein goal?',
  'Give me a 7-day meal plan',
  'What are healthy snack ideas?',
];

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${profile?.full_name?.split(' ')[0] ?? 'there'}! 👋 I'm your AI nutrition coach. I know your goals and dietary preferences. Ask me anything about nutrition, meal planning, or your health journey!`,
      id: 'welcome',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: 'user', content, id: Date.now().toString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      const { reply } = await chatWithAI(history);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, id: Date.now().toString() }]);
    } catch {
      Alert.alert('Error', 'Failed to get AI response. Make sure your API URL is configured.');
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      setInput(content);
    } finally {
      setLoading(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <LinearGradient colors={Colors.gradients.primary as any} style={styles.botAvatar}>
            <Ionicons name="leaf" size={14} color="#fff" />
          </LinearGradient>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1B4332', '#2D6A4F']} style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient colors={Colors.gradients.primary as any} style={styles.headerAvatar}>
            <Ionicons name="leaf" size={20} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>AI Nutrition Coach</Text>
            <Text style={styles.headerStatus}>Powered by Claude AI</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            loading ? (
              <View style={styles.typingRow}>
                <LinearGradient colors={Colors.gradients.primary as any} style={styles.botAvatar}>
                  <Ionicons name="leaf" size={14} color="#fff" />
                </LinearGradient>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={Colors.primaryLight} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggestions (only show when just 1 message) */}
        {messages.length === 1 && (
          <View style={styles.suggestions}>
            <Text style={styles.suggestLabel}>Try asking:</Text>
            <View style={styles.suggestRow}>
              {SUGGESTIONS.map(s => (
                <TouchableOpacity key={s} style={styles.suggestChip} onPress={() => send(s)}>
                  <Text style={styles.suggestText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your nutrition coach..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerStatus: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  list: { padding: 16, gap: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  botAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 16 },
  bubbleBot: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, marginTop: 4 },
  typingBubble: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 12, borderBottomLeftRadius: 4 },
  suggestions: { paddingHorizontal: 16, paddingBottom: 8 },
  suggestLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestChip: { backgroundColor: Colors.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  suggestText: { color: Colors.textSecondary, fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border },
  input: { flex: 1, backgroundColor: Colors.background, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 10, color: Colors.text, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
