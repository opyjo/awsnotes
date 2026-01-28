"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Note, CreateNoteInput, UpdateNoteInput } from "@/types/note";
import { notesApi } from "@/lib/aws/appsync";
import { useAuth } from "./AuthContext";

interface NotesContextType {
  notes: Note[];
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  createNote: (input: CreateNoteInput) => Promise<Note>;
  updateNote: (noteId: string, input: UpdateNoteInput) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
  getNote: (noteId: string) => Promise<Note | null>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider = ({ children }: { children: React.ReactNode }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchNotes = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const fetchedNotes = await notesApi.getNotes();
      setNotes(fetchedNotes);
    } catch (err: any) {
      setError(err.message || "Failed to fetch notes");
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const createNote = async (input: CreateNoteInput): Promise<Note> => {
    try {
      const newNote = await notesApi.createNote(input);
      setNotes((prev) => [newNote, ...prev]);
      return newNote;
    } catch (err: any) {
      setError(err.message || "Failed to create note");
      throw err;
    }
  };

  const updateNote = async (
    noteId: string,
    input: UpdateNoteInput
  ): Promise<Note> => {
    try {
      const updatedNote = await notesApi.updateNote(noteId, input);
      setNotes((prev) =>
        prev.map((note) => (note.noteId === noteId ? updatedNote : note))
      );
      return updatedNote;
    } catch (err: any) {
      setError(err.message || "Failed to update note");
      throw err;
    }
  };

  const deleteNote = async (noteId: string): Promise<void> => {
    try {
      await notesApi.deleteNote(noteId);
      setNotes((prev) => prev.filter((note) => note.noteId !== noteId));
    } catch (err: any) {
      setError(err.message || "Failed to delete note");
      throw err;
    }
  };

  const getNote = async (noteId: string): Promise<Note | null> => {
    try {
      return await notesApi.getNote(noteId);
    } catch (err: any) {
      setError(err.message || "Failed to fetch note");
      return null;
    }
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        loading,
        error,
        fetchNotes,
        createNote,
        updateNote,
        deleteNote,
        getNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
};
