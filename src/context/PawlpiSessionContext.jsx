import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  clearPawlpiGate,
  fetchPawlpiRole,
  readPawlpiGate,
  writePawlpiGate,
} from "../utils/pawlpiSession";

const PawlpiSessionContext = createContext(null);

export function PawlpiSessionProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [gateUid, setGateUid] = useState(() => readPawlpiGate());

  useEffect(() => {
    let cancelled = false;

    async function loadRole() {
      if (!user?.uid) {
        setRole(null);
        setRoleLoading(false);
        return;
      }
      setRoleLoading(true);
      try {
        const r = await fetchPawlpiRole(user.uid);
        if (!cancelled) setRole(r);
      } catch (err) {
        console.warn(err);
        if (!cancelled) setRole(null);
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    }

    loadRole();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Gate must match current user
  useEffect(() => {
    if (!user?.uid) {
      setGateUid(null);
      return;
    }
    if (gateUid && gateUid !== user.uid) {
      clearPawlpiGate();
      setGateUid(null);
    }
  }, [user?.uid, gateUid]);

  const refreshRole = useCallback(async () => {
    if (!user?.uid) {
      setRole(null);
      return null;
    }
    const r = await fetchPawlpiRole(user.uid);
    setRole(r);
    return r;
  }, [user?.uid]);

  const unlockGate = useCallback((uid) => {
    writePawlpiGate(uid);
    setGateUid(uid);
  }, []);

  const clearGate = useCallback(() => {
    clearPawlpiGate();
    setGateUid(null);
  }, []);

  const loading = authLoading || (!!user && roleLoading);
  const unlocked = Boolean(user?.uid && gateUid && gateUid === user.uid);
  const isAuthed = Boolean(user && role && unlocked);
  const canEdit = role === "editor";

  const value = useMemo(
    () => ({
      loading,
      user,
      username: user?.email || null,
      role,
      unlocked,
      isAuthed,
      canEdit,
      refreshRole,
      unlockGate,
      clearGate,
    }),
    [
      loading,
      user,
      role,
      unlocked,
      isAuthed,
      canEdit,
      refreshRole,
      unlockGate,
      clearGate,
    ],
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
