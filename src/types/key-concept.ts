export interface KeyConceptNote {
  question: string;
  answer: string;
  savedAt: string;
}

export interface KeyConcept {
  conceptId: string;
  topic: string;
  rule: string;
  notes?: KeyConceptNote[] | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKeyConceptInput {
  topic: string;
  rule: string;
}

export interface UpdateKeyConceptInput {
  notes: string; // JSON string of KeyConceptNote[]
}
