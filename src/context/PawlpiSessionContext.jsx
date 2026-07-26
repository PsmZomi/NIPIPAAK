import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  clearPawlpiSession,
  readPawlpiSession,
  writePawlpiSession,
} from "../utils/pawlpiSession";

const PawlpiSessionContext = createContext(null);

export function PawlpiSessionProvider({ children }) {
  const [username, setUsername] = useState(() => readPawlpiSession());

  const isAuthed = Boolean(username);

  const setAuthed = useCallback((name) => {
    writePawlpiSession(name);
    setUsername(name);
  }, []);

  const clearAuthed = useCallback(() => {
    clearPawlpiSession();
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({ isAuthed, username, setAuthed, clearAuthed }),
    [isAuthed, username, setAuthed, clearAuthed],
  );

  return (
    <PawlpiSessionContext.Provider value={value}>
      {children}
    </PawlpiSessionContext.Provider>
  );
}

export function usePawlpiSession() {
  const ctx = useContext(PawlpiSessionContext);
  if (!ctx) {
    throw new Error("usePawlpiSession must be used within PawlpiSessionProvider");
  }
  return ctx;
}
