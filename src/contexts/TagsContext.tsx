"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import { AnyDocument } from "@/lib/types";

type TagStat = { count: number; sample: string };

interface TagsContextValue {
  getSuggestedTag: (prefix: string, exclude: string[]) => string | null;
}

const TagsContext = createContext<TagsContextValue | undefined>(undefined);

interface TagsProviderProps {
  documents: AnyDocument[];
  children: ReactNode;
}

export function TagsProvider({ documents, children }: TagsProviderProps) {
  const stats = useMemo(() => {
    const map = new Map<string, TagStat>();
    for (const doc of documents) {
      const tags = Array.isArray((doc as any).tags) ? ((doc as any).tags as string[]) : [];
      for (const raw of tags) {
        const tag = (raw || "").trim();
        if (!tag) continue;
        const key = tag.toLowerCase();
        const prev = map.get(key);
        if (prev) map.set(key, { count: prev.count + 1, sample: prev.sample });
        else map.set(key, { count: 1, sample: tag });
      }
    }
    return map;
  }, [documents]);

  const value: TagsContextValue = {
    getSuggestedTag: (prefix: string, exclude: string[]) => {
      const p = (prefix || "").trim().toLowerCase();
      if (!p) return null;
      const excludeSet = new Set(exclude.map((t) => t.toLowerCase()));
      let best: { key: string; stat: TagStat } | null = null;
      for (const [key, stat] of stats.entries()) {
        if (!key.startsWith(p)) continue;
        if (excludeSet.has(key)) continue;
        if (!best || stat.count > best.stat.count) best = { key, stat };
      }
      return best ? best.stat.sample : null;
    },
  };

  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
}

export function useTagsContext(): TagsContextValue {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error("useTagsContext must be used within a TagsProvider");
  return ctx;
}


