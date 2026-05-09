import { generateClient, GraphQLResult } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Note, CreateNoteInput, UpdateNoteInput } from "@/types/note";
import type { Flashcard, CreateFlashcardInput } from "@/types/flashcard";
import type { Group, CreateGroupInput, UpdateGroupInput } from "@/types/group";
import type {
  Video,
  CreateVideoInput,
  UpdateVideoInput,
} from "@/types/video";

// Define a simple client type to avoid TypeScript recursive depth issues
type AmplifyClient = {
  graphql: (options: { query: string; variables?: Record<string, unknown> }) => Promise<GraphQLResult<unknown>>;
};

// Lazily initialize client to ensure Amplify is configured first
let _client: AmplifyClient | null = null;

const getClient = (): AmplifyClient => {
  if (!_client) {
    _client = generateClient({
      authMode: "userPool",
    }) as AmplifyClient;
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
  query GetNotes($limit: Int, $nextToken: String) {
    getNotes(limit: $limit, nextToken: $nextToken) {
      items {
        noteId
        title
        content
        category
        images
        createdAt
        updatedAt
      }
      nextToken
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

const UPDATE_FLASHCARD = `
  mutation UpdateFlashcard($cardId: ID!, $input: UpdateFlashcardInput!) {
    updateFlashcard(cardId: $cardId, input: $input) {
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

// ==========================================
// Groups Queries and Mutations
// ==========================================

const GET_GROUPS = `
  query GetGroups {
    getGroups {
      groupId
      name
      color
      createdAt
      updatedAt
    }
  }
`;

const GET_GROUP = `
  query GetGroup($groupId: ID!) {
    getGroup(groupId: $groupId) {
      groupId
      name
      color
      createdAt
      updatedAt
    }
  }
`;

const CREATE_GROUP = `
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      groupId
      name
      color
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_GROUP = `
  mutation UpdateGroup($groupId: ID!, $input: UpdateGroupInput!) {
    updateGroup(groupId: $groupId, input: $input) {
      groupId
      name
      color
      createdAt
      updatedAt
    }
  }
`;

const DELETE_GROUP = `
  mutation DeleteGroup($groupId: ID!) {
    deleteGroup(groupId: $groupId)
  }
`;

export const notesApi = {
  getNotes: async (): Promise<Note[]> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    // Fetch all notes with automatic pagination
    let allNotes: Note[] = [];
    let nextToken: string | null = null;

    do {
      let response: GraphQLResult<{ getNotes: { items: Note[]; nextToken: string | null } }>;
      try {
        response = (await getClient().graphql({
          query: GET_NOTES,
          variables: { limit: 1000, nextToken },
        })) as GraphQLResult<{ getNotes: { items: Note[]; nextToken: string | null } }>;
      } catch (err: any) {
        // Amplify v6 throws { errors, data } instead of returning when GraphQL errors exist.
        // If the response still contains items, use them (partial result).
        if (err?.data?.getNotes?.items) {
          response = err as GraphQLResult<{ getNotes: { items: Note[]; nextToken: string | null } }>;
        } else {
          const messages = err?.errors?.length
            ? err.errors.map((e: any) => e.message || e.errorType || "Unknown error").join(", ")
            : err instanceof Error ? err.message : "Failed to fetch notes";
          throw new Error(messages);
        }
      }

      const data = response.data?.getNotes;
      if (data?.items) {
        allNotes = allNotes.concat(data.items.filter((item): item is Note => item != null));
      }

      nextToken = data?.nextToken || null;
    } while (nextToken);

    // Sort notes alphabetically by title (case-insensitive)
    allNotes.sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "", undefined, { sensitivity: 'base' }));

    return allNotes;
  },

  getNote: async (noteId: string): Promise<Note | null> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    const response = (await getClient().graphql({
      query: GET_NOTE,
      variables: { noteId },
    })) as GraphQLResult<{ getNote: Note | null }>;
    const data = handleGraphQLResponse(response, "getNote");
    return data.getNote || null;
  },

  createNote: async (input: CreateNoteInput): Promise<Note> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    const response = (await getClient().graphql({
      query: CREATE_NOTE,
      variables: { input },
    })) as GraphQLResult<{ createNote: Note }>;

    const data = handleGraphQLResponse(response, "createNote");

    if (!data.createNote || !data.createNote.noteId) {
      throw new Error("Note creation failed - no valid note returned from server.");
    }

    return data.createNote;
  },

  updateNote: async (noteId: string, input: UpdateNoteInput): Promise<Note> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    let response: GraphQLResult<{ updateNote: Note }>;
    try {
      response = (await getClient().graphql({
        query: UPDATE_NOTE,
        variables: { noteId, input },
      })) as GraphQLResult<{ updateNote: Note }>;
    } catch (error: any) {
      // Amplify v6 may throw GraphQL errors as non-Error objects ({ errors, data })
      if (error?.errors?.length) {
        const messages = error.errors
          .map((e: any) => e.message || e.errorType || "Unknown error")
          .join(", ");
        throw new Error(messages);
      }
      if (error instanceof Error) throw error;
      throw new Error(typeof error === "string" ? error : "Failed to update note");
    }

    const data = handleGraphQLResponse(response, "updateNote");
    return data.updateNote;
  },

  deleteNote: async (noteId: string): Promise<boolean> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

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
    const data = handleGraphQLResponse(response, "getFlashcards");
    return data.getFlashcards || [];
  },

  getDueFlashcards: async (): Promise<Flashcard[]> => {
    const response = (await getClient().graphql({
      query: GET_DUE_FLASHCARDS,
    })) as GraphQLResult<{ getDueFlashcards: Flashcard[] }>;
    const data = handleGraphQLResponse(response, "getDueFlashcards");
    return data.getDueFlashcards || [];
  },

  createFlashcard: async (input: CreateFlashcardInput): Promise<Flashcard> => {
    const response = (await getClient().graphql({
      query: CREATE_FLASHCARD,
      variables: { input },
    })) as GraphQLResult<{ createFlashcard: Flashcard }>;
    const data = handleGraphQLResponse(response, "createFlashcard");
    return data.createFlashcard;
  },

  updateFlashcard: async (
    cardId: string,
    input: { deckId?: string; front?: string; back?: string },
  ): Promise<Flashcard> => {
    const response = (await getClient().graphql({
      query: UPDATE_FLASHCARD,
      variables: { cardId, input },
    })) as GraphQLResult<{ updateFlashcard: Flashcard }>;
    const data = handleGraphQLResponse(response, "updateFlashcard");
    return data.updateFlashcard;
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

// API response type with groupId instead of id
interface GroupApiResponse {
  groupId: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt?: string;
}

// Transform API response to frontend Group type
const transformGroup = (apiGroup: GroupApiResponse): Group => ({
  id: apiGroup.groupId,
  name: apiGroup.name,
  color: apiGroup.color,
  createdAt: apiGroup.createdAt,
});

export const groupsApi = {
  getGroups: async (): Promise<Group[]> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }
    
    const response = (await getClient().graphql({
      query: GET_GROUPS,
    })) as GraphQLResult<{ getGroups: GroupApiResponse[] }>;
    
    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0]?.message || "GraphQL query failed");
    }

    const groups = (response.data?.getGroups || []).map(transformGroup);

    // Sort groups alphabetically by name (case-insensitive)
    groups.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    return groups;
  },

  getGroup: async (groupId: string): Promise<Group | null> => {
    const response = (await getClient().graphql({
      query: GET_GROUP,
      variables: { groupId },
    })) as GraphQLResult<{ getGroup: GroupApiResponse | null }>;
    const data = handleGraphQLResponse(response, "getGroup");
    return data.getGroup ? transformGroup(data.getGroup) : null;
  },

  createGroup: async (input: CreateGroupInput): Promise<Group> => {
    const response = (await getClient().graphql({
      query: CREATE_GROUP,
      variables: { input },
    })) as GraphQLResult<{ createGroup: GroupApiResponse }>;
    const data = handleGraphQLResponse(response, "createGroup");
    return transformGroup(data.createGroup);
  },

  updateGroup: async (groupId: string, input: UpdateGroupInput): Promise<Group> => {
    const response = (await getClient().graphql({
      query: UPDATE_GROUP,
      variables: { groupId, input },
    })) as GraphQLResult<{ updateGroup: GroupApiResponse }>;
    const data = handleGraphQLResponse(response, "updateGroup");
    return transformGroup(data.updateGroup);
  },

  deleteGroup: async (groupId: string): Promise<boolean> => {
    const response = (await getClient().graphql({
      query: DELETE_GROUP,
      variables: { groupId },
    })) as GraphQLResult<{ deleteGroup: boolean }>;
    const data = handleGraphQLResponse(response, "deleteGroup");
    return data.deleteGroup ?? false;
  },
};

// ==========================================
// Lesson videos (AppSync)
// ==========================================

const GET_VIDEOS = `
  query GetVideos {
    getVideos {
      videoId
      title
      description
      category
      s3Key
      thumbnailKey
      duration
      order
      createdAt
      updatedAt
    }
  }
`;

const GET_VIDEO = `
  query GetVideo($videoId: ID!) {
    getVideo(videoId: $videoId) {
      videoId
      title
      description
      category
      s3Key
      thumbnailKey
      duration
      order
      createdAt
      updatedAt
    }
  }
`;

const GET_VIDEOS_BY_CATEGORY = `
  query GetVideosByCategory($category: String!) {
    getVideosByCategory(category: $category) {
      videoId
      title
      description
      category
      s3Key
      thumbnailKey
      duration
      order
      createdAt
      updatedAt
    }
  }
`;

const CREATE_VIDEO = `
  mutation CreateVideo($input: CreateVideoInput!) {
    createVideo(input: $input) {
      videoId
      title
      description
      category
      s3Key
      thumbnailKey
      duration
      order
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_VIDEO = `
  mutation UpdateVideo($videoId: ID!, $input: UpdateVideoInput!) {
    updateVideo(videoId: $videoId, input: $input) {
      videoId
      title
      description
      category
      s3Key
      thumbnailKey
      duration
      order
      createdAt
      updatedAt
    }
  }
`;

const DELETE_VIDEO = `
  mutation DeleteVideo($videoId: ID!) {
    deleteVideo(videoId: $videoId)
  }
`;

export const videosApi = {
  getVideos: async (): Promise<Video[]> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    const response = (await getClient().graphql({
      query: GET_VIDEOS,
    })) as GraphQLResult<{ getVideos: Video[] | null }>;

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0]?.message || "Failed to fetch videos");
    }

    const items = response.data?.getVideos ?? [];
    const sorted = [...items].sort((a, b) => {
      const cat = (a.category ?? "").localeCompare(b.category ?? "", undefined, {
        sensitivity: "base",
      });
      if (cat !== 0) return cat;
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return (a.title ?? "").localeCompare(b.title ?? "", undefined, {
        sensitivity: "base",
      });
    });

    return sorted;
  },

  getVideo: async (videoId: string): Promise<Video | null> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    const response = (await getClient().graphql({
      query: GET_VIDEO,
      variables: { videoId },
    })) as GraphQLResult<{ getVideo: Video | null }>;

    const data = handleGraphQLResponse(response, "getVideo");
    return data.getVideo ?? null;
  },

  getVideosByCategory: async (category: string): Promise<Video[]> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    const response = (await getClient().graphql({
      query: GET_VIDEOS_BY_CATEGORY,
      variables: { category },
    })) as GraphQLResult<{ getVideosByCategory: Video[] | null }>;

    if (response.errors && response.errors.length > 0) {
      throw new Error(
        response.errors[0]?.message || "Failed to fetch videos by category",
      );
    }

    const items = response.data?.getVideosByCategory ?? [];
    return [...items].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return (a.title ?? "").localeCompare(b.title ?? "", undefined, {
        sensitivity: "base",
      });
    });
  },

  createVideo: async (input: CreateVideoInput): Promise<Video> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    const response = (await getClient().graphql({
      query: CREATE_VIDEO,
      variables: { input },
    })) as GraphQLResult<{ createVideo: Video }>;

    const data = handleGraphQLResponse(response, "createVideo");
    return data.createVideo;
  },

  updateVideo: async (
    videoId: string,
    input: UpdateVideoInput,
  ): Promise<Video> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    const response = (await getClient().graphql({
      query: UPDATE_VIDEO,
      variables: { videoId, input },
    })) as GraphQLResult<{ updateVideo: Video }>;

    const data = handleGraphQLResponse(response, "updateVideo");
    return data.updateVideo;
  },

  deleteVideo: async (videoId: string): Promise<boolean> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    const response = (await getClient().graphql({
      query: DELETE_VIDEO,
      variables: { videoId },
    })) as GraphQLResult<{ deleteVideo: boolean }>;

    const data = handleGraphQLResponse(response, "deleteVideo");
    return data.deleteVideo ?? false;
  },
};

// ==========================================
// User Settings Queries and Mutations
// ==========================================

export interface TodoItemData {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface UserSettingsData {
  examDate: string | null;
  todos: TodoItemData[];
  updatedAt: string;
}

export interface SaveUserSettingsInput {
  examDate?: string | null;
  todos?: TodoItemData[];
}

const GET_USER_SETTINGS = `
  query GetUserSettings {
    getUserSettings {
      examDate
      todos {
        id
        text
        completed
        createdAt
      }
      updatedAt
    }
  }
`;

const SAVE_USER_SETTINGS = `
  mutation SaveUserSettings($input: SaveUserSettingsInput!) {
    saveUserSettings(input: $input) {
      examDate
      todos {
        id
        text
        completed
        createdAt
      }
      updatedAt
    }
  }
`;

export const userSettingsApi = {
  getUserSettings: async (): Promise<UserSettingsData | null> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      return null;
    }

    const response = (await getClient().graphql({
      query: GET_USER_SETTINGS,
    })) as GraphQLResult<{ getUserSettings: UserSettingsData | null }>;

    if (response.errors && response.errors.length > 0) {
      console.error("Failed to fetch user settings:", response.errors);
      return null;
    }

    return response.data?.getUserSettings || null;
  },

  saveUserSettings: async (input: SaveUserSettingsInput): Promise<UserSettingsData | null> => {
    const hasAuth = await checkAuthSession();
    if (!hasAuth) {
      throw new Error("Not authenticated. Please sign in.");
    }

    const response = (await getClient().graphql({
      query: SAVE_USER_SETTINGS,
      variables: { input },
    })) as GraphQLResult<{ saveUserSettings: UserSettingsData }>;

    if (response.errors && response.errors.length > 0) {
      console.error("Failed to save user settings:", response.errors);
      throw new Error(response.errors[0]?.message || "Failed to save settings");
    }

    return response.data?.saveUserSettings || null;
  },
};
