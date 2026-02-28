"use client";

import { ChatInterface } from "@/components/chat";

export default function ChatPage() {
  return (
    <div className="chat-page-shell -mx-4 md:-mx-6 -mt-4 md:-mt-6 flex flex-col relative overflow-hidden">
      <div className="chat-page-bg absolute inset-0 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
}
