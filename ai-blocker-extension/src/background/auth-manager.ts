const TOKEN_KEY = "authToken";
const REFRESH_KEY = "refreshToken";

export async function getAccessToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  return (result[TOKEN_KEY] as string) ?? null;
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: access, [REFRESH_KEY]: refresh });
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove([TOKEN_KEY, REFRESH_KEY]);
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}
