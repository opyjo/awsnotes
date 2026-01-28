import { generateClient, GraphQLResult } from "aws-amplify/api";
import type { Note, CreateNoteInput, UpdateNoteInput } from "@/types/note";
import type { Flashcard, CreateFlashcardInput } from "@/types/flashcard";

const client = generateClient();

// Helper to extract data from GraphQL response
const getData = <T>(response: GraphQLResult<T>): T => {
  if ('data' in response && response.data) {
    return response.data;
  }
  throw new Error('No data in GraphQL response');
};

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
    }) as GraphQLResult<{ getNotes: Note[] }>;
    return response.data?.getNotes || [];
  },

  getNote: async (noteId: string): Promise<Note | null> => {
    const response = await client.graphql({
      query: GET_NOTE,
      variables: { noteId },
    }) as GraphQLResult<{ getNote: Note | null }>;
    return response.data?.getNote || null;
  },

  createNote: async (input: CreateNoteInput): Promise<Note> => {
    const response = await client.graphql({
      query: CREATE_NOTE,
      variables: { input },
    }) as GraphQLResult<{ createNote: Note }>;
    return response.data!.createNote;
  },

  updateNote: async (
    noteId: string,
    input: UpdateNoteInput
  ): Promise<Note> => {
    const response = await client.graphql({
      query: UPDATE_NOTE,
      variables: { noteId, input },
    }) as GraphQLResult<{ updateNote: Note }>;
    return response.data!.updateNote;
  },

  deleteNote: async (noteId: string): Promise<boolean> => {
    const response = await client.graphql({
      query: DELETE_NOTE,
      variables: { noteId },
    }) as GraphQLResult<{ deleteNote: boolean }>;
    return response.data?.deleteNote ?? false;
  },
};

export const flashcardsApi = {
  getFlashcards: async (deckId: string): Promise<Flashcard[]> => {
    const response = await client.graphql({
      query: GET_FLASHCARDS,
      variables: { deckId },
    }) as GraphQLResult<{ getFlashcards: Flashcard[] }>;
    return response.data?.getFlashcards || [];
  },

  getDueFlashcards: async (): Promise<Flashcard[]> => {
    const response = await client.graphql({
      query: GET_DUE_FLASHCARDS,
    }) as GraphQLResult<{ getDueFlashcards: Flashcard[] }>;
    return response.data?.getDueFlashcards || [];
  },

  createFlashcard: async (
    input: CreateFlashcardInput
  ): Promise<Flashcard> => {
    const response = await client.graphql({
      query: CREATE_FLASHCARD,
      variables: { input },
    }) as GraphQLResult<{ createFlashcard: Flashcard }>;
    return response.data!.createFlashcard;
  },

  reviewFlashcard: async (
    cardId: string,
    quality: number
  ): Promise<Flashcard> => {
    const response = await client.graphql({
      query: REVIEW_FLASHCARD,
      variables: { cardId, quality },
    }) as GraphQLResult<{ reviewFlashcard: Flashcard }>;
    return response.data!.reviewFlashcard;
  },
};
