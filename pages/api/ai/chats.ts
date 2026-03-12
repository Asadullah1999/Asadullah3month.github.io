import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

type ResponseData = {
  success?: boolean;
  chats?: any[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
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

  if (req.method === 'GET') {
    try {
      const { data: chats, error } = await supabase
        .from('nutritionist_chats')
        .select('id, title, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch chats' });
      }

      return res.status(200).json({
        success: true,
        chats: chats || [],
      });
    } catch (error) {
      console.error('Fetch chats error:', error);
      return res.status(500).json({ error: 'Failed to fetch chats' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { chatId } = req.query;

      if (!chatId) {
        return res.status(400).json({ error: 'Chat ID required' });
      }

      // Delete messages first
      await supabase.from('chat_messages').delete().eq('chat_id', chatId as string);

      // Delete chat
      const { error } = await supabase
        .from('nutritionist_chats')
        .delete()
        .eq('id', chatId as string)
        .eq('user_id', userId);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete chat' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete chat error:', error);
      return res.status(500).json({ error: 'Failed to delete chat' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
