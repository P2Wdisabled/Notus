"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Document } from "@/lib/types";

interface SearchContextType {
  searchQuery: string;
  isSearching: boolean;
  startSearch: (query: string) => void;
  clearSearch: () => void;
  filterDocuments: (documents: Document[]) => Document[];
  filterLocalDocuments: (documents: Document[]) => Document[];
}

interface SearchProviderProps {
  children: ReactNode;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: SearchProviderProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const startSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  const filterDocuments = (documents: Document[]): Document[] => {
    if (!isSearching || !searchQuery) {
      return documents;
    }

    const query = searchQuery.toLowerCase();
    return documents.filter((doc) => {
      // Recherche uniquement dans le titre
      const titleMatch = doc.title?.toLowerCase().includes(query);

      return titleMatch;
    });
  };

  const filterLocalDocuments = (documents: Document[]): Document[] => {
    if (!isSearching || !searchQuery) {
      return documents;
    }

    const query = searchQuery.toLowerCase();
    return documents.filter((doc) => {
      // Recherche uniquement dans le titre
      const titleMatch = doc.title?.toLowerCase().includes(query);

      return titleMatch;
    });
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        isSearching,
        startSearch,
        clearSearch,
        filterDocuments,
        filterLocalDocuments,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch(): SearchContextType {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
