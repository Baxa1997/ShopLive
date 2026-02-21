// lib/history.ts
// Manages product generation history in localStorage

export interface HistoryEntry {
  id: string;
  timestamp: number;
  fileName: string;
  marketplace: 'shopify' | 'amazon' | 'both';
  productCount: number;
  products: any[]; // UnifiedProduct[]
}

const HISTORY_KEY = 'shopsready_history';
const MAX_ENTRIES = 50;

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): HistoryEntry {
  const newEntry: HistoryEntry = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  const existing = getHistory();
  const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return newEntry;
}

export function deleteHistoryEntry(id: string): void {
  const existing = getHistory();
  const updated = existing.filter(e => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}
