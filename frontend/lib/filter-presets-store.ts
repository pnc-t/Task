import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FilterPreset {
  id: string;
  name: string;
  filterStatus: string;
  filterPriority: string;
  sortBy: string;
}

interface FilterPresetsState {
  presets: FilterPreset[];
  save: (name: string, config: Omit<FilterPreset, 'id' | 'name'>) => void;
  remove: (id: string) => void;
}

export const useFilterPresetsStore = create<FilterPresetsState>()(
  persist(
    (set) => ({
      presets: [],
      save: (name, config) =>
        set((state) => ({
          presets: [...state.presets, { ...config, id: crypto.randomUUID(), name }],
        })),
      remove: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),
    }),
    { name: 'filter-presets' }
  )
);
