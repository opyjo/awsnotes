"use client";

import { ChatInterface } from "@/components/chat";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] -mx-4 md:-mx-6 -mt-4 md:-mt-6 flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-blue-50/20 to-blue-100/30 dark:from-blue-900/20 dark:via-blue-950/10 dark:to-blue-900/15 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.1),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <ChatInterface />
      </div>
    </div>
  );
}
