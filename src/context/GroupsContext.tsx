"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { Group, CreateGroupInput, UpdateGroupInput } from "@/types/group";

const STORAGE_KEY = "aws-study-notes-groups";

interface GroupsContextType {
  groups: Group[];
  loading: boolean;
  selectedGroupId: string | null;
  sidebarCollapsed: boolean;
  setSelectedGroupId: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  createGroup: (input: CreateGroupInput) => Group;
  updateGroup: (id: string, input: UpdateGroupInput) => Group | null;
  deleteGroup: (id: string) => void;
  getGroupByName: (name: string) => Group | undefined;
  getGroupById: (id: string) => Group | undefined;
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined);

const generateId = (): string => {
  return crypto.randomUUID();
};

export const GroupsProvider = ({ children }: { children: React.ReactNode }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load groups from localStorage on mount
  useEffect(() => {
    const loadGroups = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setGroups(parsed.groups || []);
          setSidebarCollapsed(parsed.sidebarCollapsed || false);
        }
      } catch (error) {
        console.error("Failed to load groups from localStorage:", error);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  // Save groups to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ groups, sidebarCollapsed })
        );
      } catch (error) {
        console.error("Failed to save groups to localStorage:", error);
      }
    }
  }, [groups, sidebarCollapsed, loading]);

  const createGroup = useCallback((input: CreateGroupInput): Group => {
    const newGroup: Group = {
      id: generateId(),
      name: input.name.trim(),
      color: input.color,
      createdAt: new Date().toISOString(),
    };

    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  }, []);

  const updateGroup = useCallback(
    (id: string, input: UpdateGroupInput): Group | null => {
      let updatedGroup: Group | null = null;

      setGroups((prev) =>
        prev.map((group) => {
          if (group.id === id) {
            updatedGroup = {
              ...group,
              ...(input.name !== undefined && { name: input.name.trim() }),
              ...(input.color !== undefined && { color: input.color }),
            };
            return updatedGroup;
          }
          return group;
        })
      );

      return updatedGroup;
    },
    []
  );

  const deleteGroup = useCallback(
    (id: string) => {
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
      selectedGroupId,
      sidebarCollapsed,
      setSelectedGroupId,
      setSidebarCollapsed,
      createGroup,
      updateGroup,
      deleteGroup,
      getGroupByName,
      getGroupById,
    }),
    [
      groups,
      loading,
      selectedGroupId,
      sidebarCollapsed,
      createGroup,
      updateGroup,
      deleteGroup,
      getGroupByName,
      getGroupById,
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
