"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Question = {
  id: string;
  q: string;
  a: string;
};

export type FAQSection = {
  id: string;
  title: string;
  questions: Question[];
};

import useSWR from 'swr';
import { fetcher } from '@/lib/api';

interface ChatCenterContextProps {
  // FAQ State
  sections: FAQSection[];
  setSections: React.Dispatch<React.SetStateAction<FAQSection[]>>;
  expandedSection: string | null;
  setExpandedSection: React.Dispatch<React.SetStateAction<string | null>>;
  isFaqLoading: boolean;
  
  // Widget Settings State
  isMessageEnabled: boolean;
  setIsMessageEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  messageText: string;
  setMessageText: React.Dispatch<React.SetStateAction<string>>;
  displayLocation: string;
  setDisplayLocation: React.Dispatch<React.SetStateAction<string>>;
  themeColor: string;
  setThemeColor: React.Dispatch<React.SetStateAction<string>>;
  whatsappNumber: string;
  setWhatsappNumber: React.Dispatch<React.SetStateAction<string>>;
  whatsappEnabled: boolean;
  setWhatsappEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  whatsappDefaultMessage: string;
  setWhatsappDefaultMessage: React.Dispatch<React.SetStateAction<string>>;
  isSettingsLoading: boolean;
}

const ChatCenterContext = createContext<ChatCenterContextProps | undefined>(undefined);

export function ChatCenterProvider({ children }: { children: ReactNode }) {
  const { data: fetchedSections, isLoading: isFaqLoading } = useSWR('/v1/admin/chat-center/faqs', fetcher);
  const { data: fetchedSettings, isLoading: isSettingsLoading } = useSWR('/v1/admin/chat-center/settings', fetcher);

  const [sections, setSections] = useState<FAQSection[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const [isMessageEnabled, setIsMessageEnabled] = useState(true);
  const [messageText, setMessageText] = useState("مرحباً بك! كيف يمكننا مساعدتك اليوم؟");
  const [displayLocation, setDisplayLocation] = useState("chat_only");
  const [themeColor, setThemeColor] = useState("#f59e0b");
  const [whatsappNumber, setWhatsappNumber] = useState("01000000000");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappDefaultMessage, setWhatsappDefaultMessage] = useState("مرحباً، أود الاستفسار عن خدمات ومنتجات Print Express.");

  // Sync state when data is loaded
  React.useEffect(() => {
    if (fetchedSections && Array.isArray(fetchedSections)) {
      const normalized = fetchedSections.map((sec: any) => ({
        id: sec.id,
        title: sec.title,
        questions: (sec.questions || []).map((q: any) => ({
          id: q.id,
          q: q.q || q.question || '',
          a: q.a || q.answer || '',
        }))
      }));
      setSections(normalized);
    }
  }, [fetchedSections]);

  React.useEffect(() => {
    if (fetchedSettings) {
      setIsMessageEnabled(fetchedSettings.isMessageEnabled ?? true);
      setMessageText(fetchedSettings.messageText ?? "مرحباً بك! كيف يمكننا مساعدتك اليوم؟");
      setDisplayLocation(fetchedSettings.displayLocation ?? "chat_only");
      setThemeColor(fetchedSettings.themeColor ?? "#f59e0b");
      setWhatsappNumber(fetchedSettings.whatsappNumber ?? "01000000000");
      setWhatsappEnabled(fetchedSettings.whatsappEnabled ?? true);
      setWhatsappDefaultMessage(fetchedSettings.whatsappDefaultMessage ?? "مرحباً، أود الاستفسار عن خدمات ومنتجات Print Express.");
    }
  }, [fetchedSettings]);

  return (
    <ChatCenterContext.Provider
      value={{
        sections,
        setSections,
        expandedSection,
        setExpandedSection,
        isFaqLoading,
        isMessageEnabled,
        setIsMessageEnabled,
        messageText,
        setMessageText,
        displayLocation,
        setDisplayLocation,
        themeColor,
        setThemeColor,
        whatsappNumber,
        setWhatsappNumber,
        whatsappEnabled,
        setWhatsappEnabled,
        whatsappDefaultMessage,
        setWhatsappDefaultMessage,
        isSettingsLoading,
      }}
    >
      {children}
    </ChatCenterContext.Provider>
  );
}

export function useChatCenter() {
  const context = useContext(ChatCenterContext);
  if (!context) {
    throw new Error("useChatCenter must be used within a ChatCenterProvider");
  }
  return context;
}
