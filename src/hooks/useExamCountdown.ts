"use client";

import { useState, useEffect } from "react";

const EXAM_DATE_KEY = "aws-study-notes-exam-date";
const DAILY_TODOS_KEY = "aws-study-notes-daily-todos";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface ExamCountdownData {
  examDate: string | null;
  daysRemaining: number | null;
}

export const useExamCountdown = () => {
  const [examDate, setExamDateState] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedDate = localStorage.getItem(EXAM_DATE_KEY);
      const storedTodos = localStorage.getItem(DAILY_TODOS_KEY);

      if (storedDate) {
        setExamDateState(storedDate);
      }
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      }
    } catch (error) {
      console.error("Failed to load exam data from localStorage:", error);
    }
  }, []);

  // Calculate days remaining whenever examDate changes
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
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);
    };

    calculateDays();
    // Update every hour to keep it fresh
    const interval = setInterval(calculateDays, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [examDate]);

  const setExamDate = (date: string | null) => {
    try {
      if (date) {
        localStorage.setItem(EXAM_DATE_KEY, date);
      } else {
        localStorage.removeItem(EXAM_DATE_KEY);
      }
      setExamDateState(date);
    } catch (error) {
      console.error("Failed to save exam date:", error);
    }
  };

  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    try {
      localStorage.setItem(DAILY_TODOS_KEY, JSON.stringify(updatedTodos));
    } catch (error) {
      console.error("Failed to save todos:", error);
    }
  };

  const toggleTodo = (id: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    try {
      localStorage.setItem(DAILY_TODOS_KEY, JSON.stringify(updatedTodos));
    } catch (error) {
      console.error("Failed to update todos:", error);
    }
  };

  const deleteTodo = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);
    try {
      localStorage.setItem(DAILY_TODOS_KEY, JSON.stringify(updatedTodos));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const clearCompleted = () => {
    const updatedTodos = todos.filter((todo) => !todo.completed);
    setTodos(updatedTodos);
    try {
      localStorage.setItem(DAILY_TODOS_KEY, JSON.stringify(updatedTodos));
    } catch (error) {
      console.error("Failed to clear completed todos:", error);
    }
  };

  return {
    examDate,
    setExamDate,
    daysRemaining,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
  };
};
