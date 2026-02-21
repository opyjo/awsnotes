"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuthToken } from "@/lib/aws/cognito";
import type { ChatMessage, ChatState, ModelId } from "@/types/chat";

const STORAGE_KEY = "aws-study-chat-history";
const DEFAULT_MODEL: ModelId = "kimi-k2-thinking";

interface UseChatResult {
  messages: ChatMessage[];
  selectedModel: ModelId;
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setModel: (model: ModelId) => void;
}

const loadFromStorage = (): ChatState | null => {
  if (typeof globalThis.window === "undefined") return null;
  try {
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading chat from storage:", error);
  }
  return null;
};

const saveToStorage = (state: ChatState) => {
  if (typeof globalThis.window === "undefined") return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving chat to storage:", error);
  }
};

export const useChat = (): UseChatResult => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelId>(DEFAULT_MODEL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setMessages(stored.messages);
      setSelectedModel(stored.selectedModel);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 || selectedModel !== DEFAULT_MODEL) {
      saveToStorage({ messages, selectedModel });
    }
  }, [messages, selectedModel]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      const assistantMessageId = `msg-${Date.now()}-${Math.random()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        model: selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const token = await getAuthToken();
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to send message");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.content) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: msg.content + parsed.content }
                        : msg
                    )
                  );
                }
              } catch (e) {
                if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                  throw e;
                }
              }
            }
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, selectedModel, isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSelectedModel(DEFAULT_MODEL);
    if (typeof globalThis.window !== "undefined") {
      globalThis.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setModel = useCallback((model: ModelId) => {
    setSelectedModel(model);
  }, []);

  return {
    messages,
    selectedModel,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setModel,
  };
};
