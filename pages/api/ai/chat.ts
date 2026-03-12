import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { buildNutritionistSystemPrompt, nutritionistChat } from '../../../lib/claude-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

type ResponseData = {
  success?: boolean;
  messageId?: string;
  response?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { chatId, message, newChat } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }

    let chat_id = chatId;

    // Create new chat if needed
    if (newChat || !chatId) {
      const { data: chatData, error: chatError } = await supabase
        .from('nutritionist_chats')
        .insert({
          user_id: userData.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat:', chatError);
        return res.status(500).json({ error: 'Failed to create chat' });
      }

      chat_id = chatData.id;
    }

    // Get recent nutrition data
    const { data: recentLogs } = await supabase
      .from('daily_logs')
      .select('total_calories, total_protein, total_carbs, total_fat, log_date')
      .eq('user_id', userData.id)
      .order('log_date', { ascending: false })
      .limit(7);

    // Get active diet plan
    const { data: dietPlan } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('user_id', userData.id)
      .eq('is_active', true)
      .single();

    // Get previous messages in chat
    const { data: previousMessages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true })
      .limit(10);

    // Build system prompt with user context
    const systemPrompt = buildNutritionistSystemPrompt(
      userData,
      recentLogs || [],
      dietPlan
    );

    // Prepare messages for Claude
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (previousMessages) {
      messages.push(...previousMessages as any);
    }
    messages.push({ role: 'user', content: message });

    // Get response from Claude
    const aiResponse = await nutritionistChat(messages, systemPrompt);

    // Save user message
    const { error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id,
        user_id: userData.id,
        role: 'user',
        content: message,
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
    }

    // Save assistant message
    const { data: assistantMsg, error: assistantMsgError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id,
        user_id: userData.id,
        role: 'assistant',
        content: aiResponse,
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
    }

    // Update chat timestamp
    await supabase
      .from('nutritionist_chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chat_id);

    return res.status(200).json({
      success: true,
      response: aiResponse,
      messageId: assistantMsg?.id,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to process chat',
    });
  }
}
