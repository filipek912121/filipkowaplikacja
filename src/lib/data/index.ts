import "server-only";
import { isDemoMode } from "@/lib/env";
import { memoryStore } from "./demo/memory-store";
import { supabaseStore } from "./supabase-store";
import type { Store } from "./store";

export function getStore(): Store {
  return isDemoMode() ? memoryStore : supabaseStore;
}
export { DuplicateError } from "./store";
