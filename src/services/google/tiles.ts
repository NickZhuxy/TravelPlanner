const SESSION_URL = 'https://tile.googleapis.com/v1/createSession';

interface TileSession {
  session: string;
  expiry: string;
}

let cachedSession: TileSession | null = null;
let fetchPromise: Promise<TileSession> | null = null;

export async function getGoogleTileSession(apiKey: string): Promise<string> {
  // Return cached session if still valid (with 5-minute buffer)
  if (cachedSession) {
    const expiryTime = new Date(cachedSession.expiry).getTime();
    if (Date.now() < expiryTime - 5 * 60 * 1000) {
      return cachedSession.session;
    }
    cachedSession = null;
  }

  // Deduplicate concurrent requests
  if (fetchPromise) return (await fetchPromise).session;

  fetchPromise = (async () => {
    const response = await fetch(`${SESSION_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mapType: 'roadmap',
        language: 'en',
        region: 'US',
      }),
    });
    if (!response.ok) throw new Error('Failed to create Google tile session');
    const data = await response.json();
    cachedSession = data as TileSession;
    return data as TileSession;
  })();

  try {
    const session = await fetchPromise;
    return session.session;
  } finally {
    fetchPromise = null;
  }
}

export function getTileUrl(sessionToken: string, apiKey: string): string {
  return `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${sessionToken}&key=${apiKey}`;
}

export function clearTileSession(): void {
  cachedSession = null;
}
