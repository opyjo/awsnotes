interface SearchParamsLike {
  get(name: string): string | null;
}

interface GroupLike {
  id: string;
  name: string;
  color?: string;
}

interface ResolveNotesGroupContextOptions {
  allowUnresolved?: boolean;
}

export interface NotesGroupContext {
  groupId: string | null;
  isAllNotes: boolean;
  isUngrouped: boolean;
  isPending: boolean;
  label: string;
  color?: string;
}

export const NOTES_UNGROUPED_ID = "__ungrouped__";

const ALL_NOTES_LABEL = "All Notes";
const UNGROUPED_LABEL = "Ungrouped";
const UNKNOWN_GROUP_LABEL = "Group";

const appendGroupQuery = (pathname: string, groupId: string | null | undefined) => {
  if (!groupId) {
    return pathname;
  }

  const params = new URLSearchParams({ groupId });
  return `${pathname}?${params.toString()}`;
};

export const parseNotesGroupId = (searchParams?: SearchParamsLike | null): string | null => {
  const groupId = searchParams?.get("groupId")?.trim();
  return groupId ? groupId : null;
};

export const buildNotesListHref = (groupId?: string | null) => appendGroupQuery("/notes", groupId);

export const buildNoteViewHref = (noteId: string, groupId?: string | null) =>
  appendGroupQuery(`/notes/${noteId}/view`, groupId);

export const buildNoteEditHref = (noteId: string, groupId?: string | null) =>
  appendGroupQuery(`/notes/${noteId}`, groupId);

export const resolveNotesGroupContext = (
  groupId: string | null,
  groups: GroupLike[],
  options: ResolveNotesGroupContextOptions = {},
): NotesGroupContext => {
  if (!groupId) {
    return {
      groupId: null,
      isAllNotes: true,
      isUngrouped: false,
      isPending: false,
      label: ALL_NOTES_LABEL,
    };
  }

  if (groupId === NOTES_UNGROUPED_ID) {
    return {
      groupId,
      isAllNotes: false,
      isUngrouped: true,
      isPending: false,
      label: UNGROUPED_LABEL,
    };
  }

  const matchingGroup = groups.find((group) => group.id === groupId);
  if (matchingGroup) {
    return {
      groupId,
      isAllNotes: false,
      isUngrouped: false,
      isPending: false,
      label: matchingGroup.name,
      color: matchingGroup.color,
    };
  }

  if (options.allowUnresolved) {
    return {
      groupId,
      isAllNotes: false,
      isUngrouped: false,
      isPending: true,
      label: UNKNOWN_GROUP_LABEL,
    };
  }

  return {
    groupId: null,
    isAllNotes: true,
    isUngrouped: false,
    isPending: false,
    label: ALL_NOTES_LABEL,
  };
};
