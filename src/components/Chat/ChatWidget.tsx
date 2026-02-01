
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Lock, Users, Wifi, Loader2, Reply, XCircle } from 'lucide-react';
import { User, ChatMessage, Rank } from '../../types';
import { RANK_COLORS } from '../../constants';
import { api } from '../../services/apiClient';

export const ChatWidget: React.FC<{ user: User | null; onLoginRequest: () => void }> = ({ user, onLoginRequest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await api.get('/chat');
      const formatted = data.map((m: any) => ({
        id: m.id.toString(),
        userId: m.user_id,
        username: m.username,
        userRank: m.user_rank as Rank,
        text: m.message_text,
        timestamp: new Date(m.created_at).getTime()
      }));
      setMessages(formatted);
    } catch (err) {
      console.error("Chat sync failed");
    }
  };


  const handleSend = async () => {
    if (!inputValue.trim() || !user || loading) return;

    setLoading(true);
    try {
      const payload: any = { text: inputValue };

      // Add reply information if replying to a message
      if (replyTo) {
        payload.replyToId = replyTo.id;
        payload.replyToText = replyTo.text;
        payload.replyToUsername = replyTo.username;
      }

      const sentMsg = await api.post('/chat', payload);
      setMessages(prev => [...prev, {
        id: sentMsg.id.toString(),
        userId: user.id,
        username: user.username,
        userRank: user.rank,
        text: sentMsg.message_text,
        timestamp: Date.now(),
        replyTo: replyTo ? {
          id: replyTo.id,
          username: replyTo.username,
          text: replyTo.text
        } : undefined
      }]);
      setInputValue('');
      setReplyTo(null); // Clear reply state
    } catch (err) {
      alert("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primaryHover rounded-full shadow-2xl flex items-center justify-center text-white transition-transform hover:scale-110 z-[100] border border-white/10"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] sm:w-96 h-[500px] max-h-[80vh] bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden animate-fade-in-up">
      <div className="bg-[#161616] p-4 border-b border-white/5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">Live Chat</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-[#666] hover:text-white"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0A] no-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare size={48} className="text-[#333] mb-4" />
            <p className="text-[#666] text-sm font-bold">No messages yet</p>
            <p className="text-[#444] text-xs mt-1">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex flex-col gap-1 ${msg.userId === user?.id ? 'items-end' : 'items-start'} animate-fade-in`}>
              {/* Username with rank color */}
              <div className={`flex items-center gap-2 ${msg.userId === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className={`text-xs font-bold ${RANK_COLORS[msg.userRank]}`}>
                  {msg.username}
                </span>
                <span className="text-[10px] text-[#444]">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message bubble with reply */}
              <div className="flex flex-col gap-1">
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm break-words ${msg.userId === user?.id
                  ? 'bg-gradient-to-br from-primary to-primaryHover text-black font-medium rounded-tr-sm'
                  : 'bg-[#1A1A1A] text-gray-200 border border-white/10 rounded-tl-sm'
                  }`}>

                  {/* Reply preview (if this message is a reply) */}
                  {msg.replyTo && (
                    <div className={`mb-2 pb-2 border-l-2 pl-2 ${msg.userId === user?.id
                      ? 'border-black/30 bg-black/10'
                      : 'border-primary/50 bg-white/5'
                      } rounded-r text-xs italic`}>
                      <div className={`font-bold ${msg.userId === user?.id ? 'text-black/70' : 'text-primary'}`}>
                        {msg.replyTo.username}
                      </div>
                      <div className={`${msg.userId === user?.id ? 'text-black/60' : 'text-[#888]'} line-clamp-2`}>
                        {msg.replyTo.text}
                      </div>
                    </div>
                  )}

                  {/* Message text */}
                  {msg.text}
                </div>

                {/* Reply button (only for other users' messages) */}
                {msg.userId !== user?.id && user && (
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="text-[10px] text-[#666] hover:text-primary flex items-center gap-1 ml-2 transition-colors"
                  >
                    <Reply size={12} />
                    Reply
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#161616] border-t border-white/5">
        {user ? (
          <div className="flex flex-col gap-2">
            {/* Reply preview bar */}
            {replyTo && (
              <div className="bg-[#0A0A0A] border border-primary/30 rounded-xl p-3 flex items-start justify-between animate-fade-in">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Reply size={14} className="text-primary flex-shrink-0" />
                    <span className="text-xs font-bold text-primary">
                      Replying to {replyTo.username}
                    </span>
                  </div>
                  <p className="text-xs text-[#888] truncate">
                    {replyTo.text}
                  </p>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-[#666] hover:text-white ml-2 flex-shrink-0"
                >
                  <XCircle size={16} />
                </button>
              </div>
            )}

            {/* Input field */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Type a message..."}
                className="flex-1 bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary"
              />
              <button onClick={handleSend} disabled={loading} className="bg-primary p-2 rounded-xl text-black disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={onLoginRequest} className="w-full py-3 bg-[#1A1A1A] text-[#666] rounded-xl text-sm font-bold border border-white/5">Login to chat</button>
        )}
      </div>
    </div>
  );
};
