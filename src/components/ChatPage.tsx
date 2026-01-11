import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToKereru, ChatHistoryItem } from '../services/kereruService';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

export const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Kia ora! I\'m Kereru AI, your sovereign New Zealand AI assistant. How can I help you today?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Convert messages to history format
      const history: ChatHistoryItem[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const responseText = await sendMessageToKereru(userMessage.content, history);
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your connection and try again.",
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-200 bg-kereru-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-kereru-green to-kereru-teal border-b border-white/10 sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
              </svg>
              <div>
                <h1 className="font-bold text-xl text-white">
                  KERERU<span className="text-kereru-neon">.AI</span> Chat
                </h1>
                <p className="text-xs text-white/70">Sovereign AI from Aotearoa</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kereru-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-kereru-neon"></span>
              </span>
              <span className="text-xs font-medium text-white">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="container mx-auto max-w-4xl space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-6 py-4 ${
                  msg.role === 'user'
                    ? 'bg-kereru-blue text-white rounded-br-md shadow-lg'
                    : 'bg-white/5 text-gray-200 border border-white/10 rounded-bl-md'
                } ${msg.isError ? 'bg-red-900/50 text-red-200 border-red-800' : ''}`}
              >
                {msg.role === 'assistant' && !msg.isError && (
                  <div className="flex items-center gap-2 mb-2 text-kereru-neon">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Kereru AI</span>
                  </div>
                )}
                <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-6 py-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-kereru-neon" />
                <span className="text-sm text-slate-400">Kereru is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Container */}
      <div className="border-t border-white/10 bg-kereru-panel/50 backdrop-blur-md sticky bottom-0">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="relative flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-kereru-neon/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask Kereru anything about New Zealand..."
              disabled={isLoading}
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none resize-none max-h-32 px-3 py-2 text-base disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-kereru-green hover:bg-kereru-neon text-white rounded-xl p-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 group"
            >
              <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Powered by sovereign AI infrastructure • Data stays in New Zealand
          </p>
        </div>
      </div>
    </div>
  );
};
