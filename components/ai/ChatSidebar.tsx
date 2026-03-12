import { useState } from 'react';
import { Plus, Trash2, MessageSquare } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  loading?: boolean;
}

export function ChatSidebar({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  loading,
}: ChatSidebarProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = (chatId: string) => {
    setDeleting(chatId);
    onDeleteChat(chatId);
    setTimeout(() => setDeleting(null), 1000);
  };

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <button
          onClick={onNewChat}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-2 px-4 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chats yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition ${
                  selectedChatId === chat.id
                    ? 'bg-blue-600'
                    : 'hover:bg-gray-800 bg-gray-800'
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <p className="text-sm font-medium truncate pr-8">{chat.title}</p>
                <p className="text-xs text-gray-400 truncate">
                  {new Date(chat.updated_at).toLocaleDateString()}
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(chat.id);
                  }}
                  disabled={deleting === chat.id}
                  className="absolute right-2 top-3 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
