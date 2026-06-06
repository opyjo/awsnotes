export interface KeyConcept {
  conceptId: string;
  topic: string;
  whatItsTesting: string;
  distractorPattern: string;
  theRule: string;
  sourceQuestion?: string;
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
