"use client";

import { create } from "zustand";

/**
 * Open/close state for the global Coach popover. Any trigger (the Coach FAB, a
 * nudge, a deep link) flips `open`; the single <CoachPopover> instance mounted
 * in AppShell subscribes and renders itself. Message/socket state lives inside
 * the popover — this store is only the visibility toggle.
 */
interface CoachUiState {
  open: boolean;
  openCoach: () => void;
  closeCoach: () => void;
  toggleCoach: () => void;
}

export const useCoachUi = create<CoachUiState>((set) => ({
  open: false,
  openCoach: () => set({ open: true }),
  closeCoach: () => set({ open: false }),
  toggleCoach: () => set((s) => ({ open: !s.open })),
}));
