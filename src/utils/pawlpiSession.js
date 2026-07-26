import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const PAWLPI_ROLES_COL = "pawlpi_roles";
export const PAWLPI_STORES_COL = "pawlpi_stores";
export const PAWLPI_COLLECTION_DOC = "collection";
export const PAWLPI_LOAN_DOC = "loan";

/** Cleared when leaving /pawlpi — forces email/password again next visit. */
export const PAWLPI_GATE_KEY = "pawlpi_gate_unlocked";

/**
 * Assign access in Firestore Console:
 * Collection: pawlpi_roles
 * Document ID: the user's Firebase Auth UID
 * Field: role (string) = "editor" | "viewer"
 */
export async function fetchPawlpiRole(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, PAWLPI_ROLES_COL, uid));
  if (!snap.exists()) return null;
  const role = snap.data()?.role;
  if (role === "editor" || role === "viewer") return role;
  return null;
}

export function readPawlpiGate() {
  try {
    const raw = sessionStorage.getItem(PAWLPI_GATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.uid || null;
  } catch {
    return null;
  }
}

export function writePawlpiGate(uid) {
  sessionStorage.setItem(PAWLPI_GATE_KEY, JSON.stringify({ uid }));
}

export function clearPawlpiGate() {
  sessionStorage.removeItem(PAWLPI_GATE_KEY);
}
