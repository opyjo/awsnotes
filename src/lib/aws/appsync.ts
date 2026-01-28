import { generateClient } from "aws-amplify/api";
import type { Note, CreateNoteInput, UpdateNoteInput } from "@/types/note";
import type { Flashcard, CreateFlashcardInput } from "@/types/flashcard";

const client = generateClient();

const GET_NOTES = `
  query GetNotes {
    getNotes {
      noteId
      title
      content
      category
      tags
      images
      createdAt
      updatedAt
    }
  }
`;

const GET_NOTE = `
  query GetNote($noteId: ID!) {
    getNote(noteId: $noteId) {
      noteId
      title
      content
      category
      tags
      images
      createdAt
      updatedAt
    }
  }
`;

const CREATE_NOTE = `
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      noteId
      title
      content
      category
      tags
      images
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_NOTE = `
  mutation UpdateNote($noteId: ID!, $input: UpdateNoteInput!) {
    updateNote(noteId: $noteId, input: $input) {
      noteId
      title
      content
      category
      tags
      images
      createdAt
      updatedAt
    }
  }
`;

const DELETE_NOTE = `
  mutation DeleteNote($noteId: ID!) {
    deleteNote(noteId: $noteId)
  }
`;

const GET_FLASHCARDS = `
  query GetFlashcards($deckId: ID!) {
    getFlashcards(deckId: $deckId) {
      cardId
      deckId
      front
      back
      noteId
      easeFactor
      interval
      repetitions
      nextReviewDate
      createdAt
    }
  }
`;

const GET_DUE_FLASHCARDS = `
  query GetDueFlashcards {
    getDueFlashcards {
      cardId
      deckId
      front
      back
      noteId
      easeFactor
      interval
      repetitions
      nextReviewDate
      createdAt
    }
  }
`;

const CREATE_FLASHCARD = `
  mutation CreateFlashcard($input: CreateFlashcardInput!) {
    createFlashcard(input: $input) {
      cardId
      deckId
      front
      back
      noteId
      easeFactor
      interval
      repetitions
      nextReviewDate
      createdAt
    }
  }
`;

const REVIEW_FLASHCARD = `
  mutation ReviewFlashcard($cardId: ID!, $quality: Int!) {
    reviewFlashcard(cardId: $cardId, quality: $quality) {
      cardId
      deckId
      front
      back
      noteId
      easeFactor
      interval
      repetitions
      nextReviewDate
      createdAt
    }
  }
`;

export const notesApi = {
  getNotes: async (): Promise<Note[]> => {
    const response = await client.graphql({
      query: GET_NOTES,
    });
    return response.data.getNotes || [];
  },

  getNote: async (noteId: string): Promise<Note | null> => {
    const response = await client.graphql({
      query: GET_NOTE,
      variables: { noteId },
    });
    return response.data.getNote;
  },

  createNote: async (input: CreateNoteInput): Promise<Note> => {
    const response = await client.graphql({
      query: CREATE_NOTE,
      variables: { input },
    });
    return response.data.createNote;
  },

  updateNote: async (
    noteId: string,
    input: UpdateNoteInput
  ): Promise<Note> => {
    const response = await client.graphql({
      query: UPDATE_NOTE,
      variables: { noteId, input },
    });
    return response.data.updateNote;
  },

  deleteNote: async (noteId: string): Promise<boolean> => {
    const response = await client.graphql({
      query: DELETE_NOTE,
      variables: { noteId },
    });
    return response.data.deleteNote;
  },
};

export const flashcardsApi = {
  getFlashcards: async (deckId: string): Promise<Flashcard[]> => {
    const response = await client.graphql({
      query: GET_FLASHCARDS,
      variables: { deckId },
    });
    return response.data.getFlashcards || [];
  },

  getDueFlashcards: async (): Promise<Flashcard[]> => {
    const response = await client.graphql({
      query: GET_DUE_FLASHCARDS,
    });
    return response.data.getDueFlashcards || [];
  },

  createFlashcard: async (
    input: CreateFlashcardInput
  ): Promise<Flashcard> => {
    const response = await client.graphql({
      query: CREATE_FLASHCARD,
      variables: { input },
    });
    return response.data.createFlashcard;
  },

  reviewFlashcard: async (
    cardId: string,
    quality: number
  ): Promise<Flashcard> => {
    const response = await client.graphql({
      query: REVIEW_FLASHCARD,
      variables: { cardId, quality },
    });
    return response.data.reviewFlashcard;
  },
};
