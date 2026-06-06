export interface KeyConceptNote {
  question: string;
  answer: string;
  savedAt: string;
}

export interface KeyConcept {
  conceptId: string;
  topic: string;
  whatItsTesting: string;
  distractorPattern: string;
  theRule: string;
  sourceQuestion?: string;
  notes?: KeyConceptNote[] | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKeyConceptInput {
  topic: string;
  whatItsTesting: string;
  distractorPattern: string;
  theRule: string;
  sourceQuestion?: string;
}

export interface UpdateKeyConceptInput {
  notes: string; // JSON string of KeyConceptNote[]
}
