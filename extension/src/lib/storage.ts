import { storage } from "wxt/utils/storage";
import type { AuthState, ApplyStatus } from "./types";

export const authStorage = storage.defineItem<AuthState | null>("local:auth", {
  fallback: null,
});

export const statusStorage = storage.defineItem<ApplyStatus>("local:status", {
  fallback: {
    state: "idle",
    currentJob: null,
    queue: [],
    completed: 0,
    failed: 0,
    dailyCount: 0,
    dailyLimit: 10,
    logs: [],
  },
});
