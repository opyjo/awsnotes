import { generateClient, GraphQLResult } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Note, CreateNoteInput, UpdateNoteInput } from "@/types/note";
import type { Flashcard, CreateFlashcardInput } from "@/types/flashcard";

// Lazily initialize client to ensure Amplify is configured first
let _client: ReturnType<typeof generateClient> | null = null;

const getClient = () => {
  if (!_client) {
    _client = generateClient({
      authMode: "userPool",
    });
  }
  return _client;
};

// Helper to check if user has valid auth session
const checkAuthSession = async (): Promise<boolean> => {
  try {
    const session = await fetchAuthSession();
    return !!session.tokens?.idToken;
  } catch {
    return false;
  }
};

// Helper to handle GraphQL errors
const handleGraphQLResponse = <T>(
  response: GraphQLResult<T>,
  operationName: string,
): T => {
  if (response.errors && response.errors.length > 0) {
    const errorMessages = response.errors
      .map((e) => e.message || (e as any).errorType || "Unknown error")
      .join(", ");
    
    const isAuthError = response.errors.some(
      (e) =>
        e.message?.includes("Unauthorized") ||
        e.message?.includes("not authorized") ||
        (e as any).errorType === "Unauthorized"
    );
    
    if (isAuthError) {
      throw new Error("Authorization failed. Please sign in again.");
    }
    
    throw new Error(errorMessages || `Error in ${operationName}`);
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
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }
    
    const response = (await getClient().graphql({
      query: GET_NOTES,
    })) as GraphQLResult<{ getNotes: Note[] }>;
    
    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0]?.message || "GraphQL query failed");
    }
    
    return response.data?.getNotes || [];
  },

  getNote: async (noteId: string): Promise<Note | null> => {
    const response = (await getClient().graphql({
      query: GET_NOTE,
      variables: { noteId },
    })) as GraphQLResult<{ getNote: Note | null }>;
    const data = handleGraphQLResponse(response, "getNote");
    return data.getNote || null;
  },

  createNote: async (input: CreateNoteInput): Promise<Note> => {
    const response = (await getClient().graphql({
      query: CREATE_NOTE,
      variables: { input },
    })) as GraphQLResult<{ createNote: Note }>;
    const data = handleGraphQLResponse(response, "createNote");
    return data.createNote;
  },

  updateNote: async (noteId: string, input: UpdateNoteInput): Promise<Note> => {
    const response = (await getClient().graphql({
      query: UPDATE_NOTE,
      variables: { noteId, input },
    })) as GraphQLResult<{ updateNote: Note }>;
    const data = handleGraphQLResponse(response, "updateNote");
    return data.updateNote;
  },

  deleteNote: async (noteId: string): Promise<boolean> => {
    const response = (await getClient().graphql({
      query: DELETE_NOTE,
      variables: { noteId },
    })) as GraphQLResult<{ deleteNote: boolean }>;
    const data = handleGraphQLResponse(response, "deleteNote");
    return data.deleteNote ?? false;
  },
};

export const flashcardsApi = {
  getFlashcards: async (deckId: string): Promise<Flashcard[]> => {
    const response = (await getClient().graphql({
      query: GET_FLASHCARDS,
      variables: { deckId },
    })) as GraphQLResult<{ getFlashcards: Flashcard[] }>;
    return response.data?.getFlashcards || [];
  },

  getDueFlashcards: async (): Promise<Flashcard[]> => {
    const response = (await getClient().graphql({
      query: GET_DUE_FLASHCARDS,
    })) as GraphQLResult<{ getDueFlashcards: Flashcard[] }>;
    return response.data?.getDueFlashcards || [];
  },

  createFlashcard: async (input: CreateFlashcardInput): Promise<Flashcard> => {
    const response = (await getClient().graphql({
      query: CREATE_FLASHCARD,
      variables: { input },
    })) as GraphQLResult<{ createFlashcard: Flashcard }>;
    return response.data!.createFlashcard;
  },

  reviewFlashcard: async (
    cardId: string,
    quality: number,
  ): Promise<Flashcard> => {
    const response = (await getClient().graphql({
      query: REVIEW_FLASHCARD,
      variables: { cardId, quality },
    })) as GraphQLResult<{ reviewFlashcard: Flashcard }>;
    
    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors.map(e => e.message).join(", "));
    }
    
    if (!response.data?.reviewFlashcard) {
      throw new Error("No data returned from reviewFlashcard");
    }
    
    return response.data.reviewFlashcard;
  },
};
