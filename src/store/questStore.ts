import { create } from 'zustand';
import type { Quest } from '../types';

interface QuestState {
  quests: Quest[];
  loading: boolean;
  setQuests: (quests: Quest[]) => void;
  addQuest: (quest: Quest) => void;
  updateQuest: (qid: string, updates: Partial<Quest>) => void;
  removeQuest: (qid: string) => void;
}

export const useQuestStore = create<QuestState>((set) => ({
  quests: [],
  loading: true,
  setQuests: (quests) => set({ quests, loading: false }),
  addQuest: (quest) => set((state) => ({ quests: [quest, ...state.quests] })),
  updateQuest: (qid, updates) =>
    set((state) => ({
      quests: state.quests.map((q) => (q.qid === qid ? { ...q, ...updates } : q)),
    })),
  removeQuest: (qid) =>
    set((state) => ({
      quests: state.quests.filter((q) => (q.qid !== qid)),
    })),
}));
