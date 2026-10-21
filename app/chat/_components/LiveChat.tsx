"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Send, User, MoreVertical, Image as ImageIcon, Smile, Trash2, Ban, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import useSWR from 'swr';
import { fetcher, apiClient } from '@/lib/api';

type Message = { id: string | number; text: string; sender: string; time: string; isImage?: boolean };
type Conversation = { id: string | number; name: string; lastMessage: string; time: string; unread: number; online: boolean };

export default function LiveChat() {
  const { data: fetchedConversations, mutate: mutateConversations } = useSWR<any[]>(
    '/v1/admin/chat-center/conversations',
    fetcher,
    { refreshInterval: 4000 }
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | number | null>(null);
  
  const { data: fetchedMessages, mutate: mutateMessages } = useSWR<Message[]>(
    activeConv ? `/v1/admin/chat-center/conversations/${activeConv}/messages` : null,
    fetcher,
    { refreshInterval: 3000 }
  );
  
  const [message, setMessage] = useState("");
  const [messagesByConv, setMessagesByConv] = useState<Record<string, Message[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Cleanup Object URLs to prevent memory leaks
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (fetchedConversations && Array.isArray(fetchedConversations)) {
      const normalized: Conversation[] = fetchedConversations.map((c: any) => ({
        id: c.id,
        name: c.name,
        lastMessage: c.lastMessage || 'بدأت المحادثة',
        time: c.time || '',
        unread: c.unread !== undefined ? c.unread : (c.unreadCount || 0),
        online: c.online !== undefined ? c.online : (c.isOnline ?? true),
      }));
      setConversations(normalized);
      if (activeConv === null && normalized.length > 0) {
        setActiveConv(normalized[0].id);
      }
    }
  }, [fetchedConversations]);

  useEffect(() => {
    if (activeConv && fetchedMessages) {
      setMessagesByConv(prev => ({
        ...prev,
        [String(activeConv)]: fetchedMessages
      }));
    }
  }, [activeConv, fetchedMessages]);

  const activeUser = conversations.find((c) => String(c.id) === String(activeConv));

  const currentMessages = activeConv ? messagesByConv[String(activeConv)] || [] : [];

  const handleSendMessage = async () => {
    if (!message.trim() || !activeConv) return;
    
    const textToSend = message.trim();
    setMessage(""); // Optimistic clear
    
    const newMessage = {
      id: Date.now(),
      text: textToSend,
      sender: "agent",
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessagesByConv(prev => ({
      ...prev,
      [String(activeConv)]: [...(prev[String(activeConv)] || []), newMessage]
    }));
    
    try {
      await apiClient(`/v1/admin/chat-center/conversations/${activeConv}/messages`, {
        method: 'POST',
        body: { text: textToSend, isImage: false }
      });
      mutateMessages();
    } catch (error) {
      console.error(error);
      alert("فشل في إرسال الرسالة");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConversationClick = async (id: string | number) => {
    setActiveConv(id);
    setConversations(prev => prev.map(c => String(c.id) === String(id) ? { ...c, unread: 0 } : c));
    setIsMobileChatOpen(true);
    
    try {
      await apiClient(`/v1/admin/chat-center/conversations/${id}/read`, { method: 'PUT' });
      mutateConversations();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEndConversation = async () => {
    if (!activeConv) return;
    setConversations(prev => prev.map(c => String(c.id) === String(activeConv) ? { ...c, online: false } : c));
    setShowOptions(false);
    try {
      await apiClient(`/v1/admin/chat-center/conversations/${activeConv}/end`, { method: 'PUT' });
      mutateConversations();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    
    // Using object URL for mock preview
    const imageUrl = URL.createObjectURL(file);
    objectUrlsRef.current.push(imageUrl);
    
    const newMessage = {
      id: Date.now(),
      text: imageUrl,
      sender: "agent",
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isImage: true
    };

    setMessagesByConv(prev => ({
      ...prev,
      [String(activeConv)]: [...(prev[String(activeConv)] || []), newMessage]
    }));
    
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      await apiClient(`/v1/admin/chat-center/conversations/${activeConv}/messages`, {
        method: 'POST',
        body: formData,
        isFormData: true
      });
      mutateMessages();
    } catch (error) {
      console.error(error);
      alert("فشل في رفع الصورة");
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full md:min-h-[500px]">
      {/* Conversations List */}
      <div className={cn(
        "w-full md:w-1/3 md:min-w-[280px] md:max-w-[320px] border-l border-slate-200 flex flex-col bg-slate-50/50",
        isMobileChatOpen ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في المحادثات..."
              className="pl-3 pr-9 bg-white border-slate-200 rounded-xl"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleConversationClick(conv.id)}
              className={cn(
                "w-full text-right p-4 border-b border-slate-100 transition-colors hover:bg-slate-50 flex gap-3",
                String(activeConv) === String(conv.id) ? "bg-amber-50/50 hover:bg-amber-50/80 relative" : ""
              )}
            >
              {String(activeConv) === String(conv.id) && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
              )}
              <div className="relative">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                  <User className="text-slate-400 w-6 h-6" />
                </div>
                {conv.online && (
                  <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{conv.name}</h3>
                  <span className="text-xs text-slate-400 whitespace-nowrap mr-2">{conv.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1">
                  {conv.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "w-full md:flex-1 flex-col bg-[#F8FAFC]",
        !isMobileChatOpen ? "hidden md:flex" : "flex"
      )}>
        {/* Chat Header */}
        <div className="h-16 px-4 md:px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden ml-1 text-slate-500 hover:bg-slate-100 h-8 w-8"
              onClick={() => setIsMobileChatOpen(false)}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="relative">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="text-slate-400 w-5 h-5" />
              </div>
              {activeUser?.online && (
                 <div className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">{activeUser?.name}</h2>
              <p className="text-xs text-slate-500">
                {activeUser?.online ? "متصل الآن" : "غير متصل"}
              </p>
            </div>
          </div>
          <div className="relative" ref={optionsMenuRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 hover:text-slate-600"
              onClick={() => setShowOptions(!showOptions)}
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
            
            {showOptions && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button 
                  onClick={async () => {
                    if (!activeConv) return;
                    setMessagesByConv(prev => ({ ...prev, [activeConv]: [] }));
                    setShowOptions(false);
                    try {
                      await apiClient(`/v1/admin/chat-center/conversations/${activeConv}`, { method: 'DELETE' });
                      setConversations(prev => prev.filter(c => String(c.id) !== String(activeConv)));
                      setActiveConv(null);
                      mutateConversations();
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                  className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  مسح المحادثة
                </button>
                <button 
                  onClick={handleEndConversation}
                  className="w-full text-right px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                >
                  <Ban className="w-4 h-4" />
                  إنهاء المحادثة
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          {currentMessages.map((msg) => {
            const isAgent = msg.sender === "agent";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[75%]",
                  isAgent ? "mr-auto items-end" : "ml-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    isAgent
                      ? "bg-amber-600 text-white rounded-tl-none"
                      : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tr-none",
                    msg.isImage && "p-2 bg-transparent border-none shadow-none"
                  )}
                >
                  {msg.isImage ? (
                    <img src={msg.text} alt="Uploaded" className="max-w-[200px] sm:max-w-xs rounded-xl max-h-64 object-cover shadow-sm border border-slate-200" />
                  ) : (
                    msg.text
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400 transition-all relative">
            
            <div className="relative flex-shrink-0" ref={emojiPickerRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-400 shrink-0 rounded-xl hover:bg-slate-200 h-10 w-10"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-5 h-5" />
              </Button>
              {showEmojiPicker && (
                <div className="absolute bottom-[calc(100%+0.5rem)] right-0 p-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 flex flex-wrap gap-1 w-52 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {["😊", "😂", "🥰", "👍", "🙏", "❤️", "🔥", "✨", "🎉", "🤔"].map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => handleEmojiClick(emoji)} 
                      className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg text-xl transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-400 shrink-0 rounded-xl hover:bg-slate-200 h-10 w-10"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
              accept="image/*" 
              className="hidden" 
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[40px] text-sm py-2 px-2 custom-scrollbar outline-none text-slate-700"
              rows={1}
            />
            <Button onClick={handleSendMessage} className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-white h-10 w-10 p-0 flex items-center justify-center">
              <Send className="w-4 h-4 rtl:-scale-x-100" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
