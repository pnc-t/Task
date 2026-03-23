import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProjectFavoritesState {
  favorites: Set<string>;
  toggle: (projectId: string) => void;
  isFavorite: (projectId: string) => boolean;
}

export const useProjectFavoritesStore = create<ProjectFavoritesState>()(
  persist(
    (set, get) => ({
      favorites: new Set<string>(),
      toggle: (projectId) =>
        set((state) => {
          const next = new Set(state.favorites);
          if (next.has(projectId)) {
            next.delete(projectId);
          } else {
            next.add(projectId);
          }
          return { favorites: next };
        }),
      isFavorite: (projectId) => get().favorites.has(projectId),
    }),
    {
      name: 'project-favorites',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          if (parsed?.state?.favorites) {
            parsed.state.favorites = new Set(parsed.state.favorites);
          }
          return parsed;
        },
        setItem: (name, value) => {
          const serialized = {
            ...value,
            state: {
              ...value.state,
              favorites: Array.from(value.state.favorites),
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
