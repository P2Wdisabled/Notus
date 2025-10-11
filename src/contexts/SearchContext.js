"use client";

import { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const startSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  const filterDocuments = (documents) => {
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

  const filterLocalDocuments = (documents) => {
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

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
}
