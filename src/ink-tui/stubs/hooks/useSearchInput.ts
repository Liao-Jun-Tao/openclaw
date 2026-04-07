import { useState, useCallback } from "react";

export function useSearchInput() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const startSearch = useCallback(() => setIsSearching(true), []);
  const stopSearch = useCallback(() => {
    setIsSearching(false);
    setSearchQuery("");
  }, []);

  return { searchQuery, setSearchQuery, isSearching, startSearch, stopSearch };
}
