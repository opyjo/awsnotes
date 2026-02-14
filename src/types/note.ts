export interface Note {
  noteId: string;
  title: string;
  content: string;
  category?: string;

  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  category?: string;

  images?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  category?: string;

  images?: string[];
}
