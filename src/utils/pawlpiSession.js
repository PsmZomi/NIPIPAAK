export const PAWLPI_SESSION_KEY = "pawlpi_auth";

export const PAWLPI_ACCOUNTS = [
  { label: "Account 1", username: "admin1", password: "admin123" },
  { label: "Account 2", username: "admin2", password: "admin456" },
];

export function readPawlpiSession() {
  try {
    const raw = sessionStorage.getItem(PAWLPI_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const valid = PAWLPI_ACCOUNTS.some(
      (a) => a.username === parsed?.username,
    );
    return valid ? parsed.username : null;
  } catch {
    return null;
  }
}

export function writePawlpiSession(username) {
  sessionStorage.setItem(PAWLPI_SESSION_KEY, JSON.stringify({ username }));
}

export function clearPawlpiSession() {
  sessionStorage.removeItem(PAWLPI_SESSION_KEY);
}

export function findPawlpiAccount(username, password) {
  return PAWLPI_ACCOUNTS.find(
    (a) => a.username === username.trim() && a.password === password,
  );
}
