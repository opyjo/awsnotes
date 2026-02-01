"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { groupsApi } from "@/lib/aws/appsync";
import type { Group, CreateGroupInput, UpdateGroupInput } from "@/types/group";

interface GroupsContextType {
  groups: Group[];
  loading: boolean;
  error: string | null;
  selectedGroupId: string | null;
  sidebarCollapsed: boolean;
  setSelectedGroupId: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  createGroup: (input: CreateGroupInput) => Promise<Group>;
  updateGroup: (id: string, input: UpdateGroupInput) => Promise<Group | null>;
  deleteGroup: (id: string) => Promise<void>;
  getGroupByName: (name: string) => Group | undefined;
  getGroupById: (id: string) => Group | undefined;
  refreshGroups: () => Promise<void>;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

const SIDEBAR_STATE_KEY = "aws-study-notes-sidebar-collapsed";

export const GroupsProvider = ({ children }: { children: React.ReactNode }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

  // Load sidebar state from localStorage (UI preference only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (stored) {
        setSidebarCollapsedState(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load sidebar state:", err);
    }
  }, []);

  // Save sidebar state to localStorage
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(collapsed));
    } catch (err) {
      console.error("Failed to save sidebar state:", err);
    }
  }, []);

  // Fetch groups from backend
  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedGroups = await groupsApi.getGroups();
      setGroups(fetchedGroups);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch groups";
      console.error("Failed to fetch groups:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const refreshGroups = useCallback(async () => {
    await fetchGroups();
  }, [fetchGroups]);

  const createGroup = useCallback(async (input: CreateGroupInput): Promise<Group> => {
    const newGroup = await groupsApi.createGroup(input);
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  }, []);

  const updateGroup = useCallback(
    async (id: string, input: UpdateGroupInput): Promise<Group | null> => {
      const updatedGroup = await groupsApi.updateGroup(id, input);
      if (updatedGroup) {
        setGroups((prev) =>
          prev.map((group) => (group.id === id ? updatedGroup : group))
        );
      }
      return updatedGroup;
    },
    []
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      await groupsApi.deleteGroup(id);
      setGroups((prev) => prev.filter((group) => group.id !== id));
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
    },
    [selectedGroupId]
  );

  const getGroupByName = useCallback(
    (name: string): Group | undefined => {
      return groups.find(
        (g) => g.name.toLowerCase() === name.toLowerCase()
      );
    },
    [groups]
  );

  const getGroupById = useCallback(
    (id: string): Group | undefined => {
      return groups.find((g) => g.id === id);
    },
    [groups]
  );

  const contextValue = useMemo(
    () => ({
      groups,
      loading,
      error,
      selectedGroupId,
      sidebarCollapsed,
      setSelectedGroupId,
      setSidebarCollapsed,
      createGroup,
      updateGroup,
      deleteGroup,
      getGroupByName,
      getGroupById,
      refreshGroups,
    }),
    [
      groups,
      loading,
      error,
      selectedGroupId,
      sidebarCollapsed,
      setSidebarCollapsed,
      createGroup,
      updateGroup,
      deleteGroup,
      getGroupByName,
      getGroupById,
      refreshGroups,
    ]
  );

  return (
    <GroupsContext.Provider value={contextValue}>
      {children}
    </GroupsContext.Provider>
  );
};

export const useGroups = () => {
  const context = useContext(GroupsContext);
  if (context === undefined) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
};
