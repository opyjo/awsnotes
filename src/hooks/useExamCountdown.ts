"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { userSettingsApi, type TodoItemData } from "@/lib/aws/appsync";
import { useAuth } from "@/context/AuthContext";

const CACHE_KEY = "aws-study-notes-exam-settings";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface CachedSettings {
  examDate: string | null;
  todos: Todo[];
}

// Read cache for instant UI (before API responds)
const readCache = (): CachedSettings | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const writeCache = (data: CachedSettings) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable
  }
};

export const useExamCountdown = () => {
  const { user } = useAuth();
  const [examDate, setExamDateState] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load: cache first for instant UI, then API for truth
  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setExamDateState(cached.examDate);
      setTodos(cached.todos);
    }

    if (user) {
      userSettingsApi.getUserSettings().then((settings) => {
        if (settings) {
          const apiTodos: Todo[] = (settings.todos || []).map((t) => ({
            id: t.id,
            text: t.text,
            completed: t.completed,
            createdAt: t.createdAt,
          }));
          setExamDateState(settings.examDate || null);
          setTodos(apiTodos);
          writeCache({ examDate: settings.examDate || null, todos: apiTodos });
        }
        setLoaded(true);
      }).catch((err) => {
        console.error("Failed to load settings from API:", err);
        setLoaded(true);
      });
    } else {
      setLoaded(true);
    }
  }, [user]);

  // Calculate days remaining
  useEffect(() => {
    if (!examDate) {
      setDaysRemaining(null);
      return;
    }

    const calculateDays = () => {
      const exam = new Date(examDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      exam.setHours(0, 0, 0, 0);
      const diffTime = exam.getTime() - today.getTime();
      setDaysRemaining(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    };

    calculateDays();
    const interval = setInterval(calculateDays, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [examDate]);

  // Debounced save to API
  const persistToApi = useCallback(
    (newExamDate: string | null, newTodos: Todo[]) => {
      writeCache({ examDate: newExamDate, todos: newTodos });

      if (!user) return;

      // Debounce saves to avoid excessive API calls
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        const todosInput: TodoItemData[] = newTodos.map((t) => ({
          id: t.id,
          text: t.text,
          completed: t.completed,
          createdAt: t.createdAt,
        }));

        userSettingsApi
          .saveUserSettings({
            examDate: newExamDate,
            todos: todosInput,
          })
          .catch((err) => {
            console.error("Failed to save settings:", err);
          });
      }, 500);
    },
    [user]
  );

  const setExamDate = useCallback(
    (date: string | null) => {
      setExamDateState(date);
      setTodos((currentTodos) => {
        persistToApi(date, currentTodos);
        return currentTodos;
      });
    },
    [persistToApi]
  );

  const addTodo = useCallback(
    (text: string) => {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      setTodos((prev) => {
        const updated = [...prev, newTodo];
        setExamDateState((currentDate) => {
          persistToApi(currentDate, updated);
          return currentDate;
        });
        return updated;
      });
    },
    [persistToApi]
  );

  const toggleTodo = useCallback(
    (id: string) => {
      setTodos((prev) => {
        const updated = prev.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        setExamDateState((currentDate) => {
          persistToApi(currentDate, updated);
          return currentDate;
        });
        return updated;
      });
    },
    [persistToApi]
  );

  const deleteTodo = useCallback(
    (id: string) => {
      setTodos((prev) => {
        const updated = prev.filter((todo) => todo.id !== id);
        setExamDateState((currentDate) => {
          persistToApi(currentDate, updated);
          return currentDate;
        });
        return updated;
      });
    },
    [persistToApi]
  );

  const clearCompleted = useCallback(() => {
    setTodos((prev) => {
      const updated = prev.filter((todo) => !todo.completed);
      setExamDateState((currentDate) => {
        persistToApi(currentDate, updated);
        return currentDate;
      });
      return updated;
    });
  }, [persistToApi]);

  return {
    examDate,
    setExamDate,
    daysRemaining,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    loaded,
  };
};
