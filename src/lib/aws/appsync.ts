import { generateClient, GraphQLResult } from "aws-amplify/api";
import type { Note, CreateNoteInput, UpdateNoteInput } from "@/types/note";
import type { Flashcard, CreateFlashcardInput } from "@/types/flashcard";

const client = generateClient();

// Helper to handle GraphQL errors
const handleGraphQLResponse = <T>(response: GraphQLResult<T>, operationName: string): T => {
  // Check for GraphQL errors
  if (response.errors && response.errors.length > 0) {
    const errorMessages = response.errors.map(e => e.message).join(", ");
    console.error(`GraphQL errors in ${operationName}:`, response.errors);
    throw new Error(errorMessages);
  }
  
  if (!response.data) {
    throw new Error(`No data returned from ${operationName}`);
  }
  
  return response.data;
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
    try {
      const response = await client.graphql({
        query: GET_NOTES,
      }) as GraphQLResult<{ getNotes: Note[] }>;
      const data = handleGraphQLResponse(response, "getNotes");
      return data.getNotes || [];
    } catch (error: any) {
      console.error("getNotes error:", error);
      throw error;
    }
  },

  getNote: async (noteId: string): Promise<Note | null> => {
    try {
      const response = await client.graphql({
        query: GET_NOTE,
        variables: { noteId },
      }) as GraphQLResult<{ getNote: Note | null }>;
      const data = handleGraphQLResponse(response, "getNote");
      return data.getNote || null;
    } catch (error: any) {
      console.error("getNote error:", error);
      throw error;
    }
  },

  createNote: async (input: CreateNoteInput): Promise<Note> => {
    try {
      const response = await client.graphql({
        query: CREATE_NOTE,
        variables: { input },
      }) as GraphQLResult<{ createNote: Note }>;
      const data = handleGraphQLResponse(response, "createNote");
      return data.createNote;
    } catch (error: any) {
      console.error("createNote error:", error);
      throw error;
    }
  },

  updateNote: async (
    noteId: string,
    input: UpdateNoteInput
  ): Promise<Note> => {
    try {
      const response = await client.graphql({
        query: UPDATE_NOTE,
        variables: { noteId, input },
      }) as GraphQLResult<{ updateNote: Note }>;
      const data = handleGraphQLResponse(response, "updateNote");
      return data.updateNote;
    } catch (error: any) {
      console.error("updateNote error:", error);
      throw error;
    }
  },

  deleteNote: async (noteId: string): Promise<boolean> => {
    try {
      const response = await client.graphql({
        query: DELETE_NOTE,
        variables: { noteId },
      }) as GraphQLResult<{ deleteNote: boolean }>;
      const data = handleGraphQLResponse(response, "deleteNote");
      return data.deleteNote ?? false;
    } catch (error: any) {
      console.error("deleteNote error:", error);
      throw error;
    }
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
