// Relative /api paths go through the Vite dev proxy, so port 8000 never needs to be public.
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  activities: <T>() => getJson<T>('/api/activities'),
  teams: <T>() => getJson<T>('/api/teams'),
  leaderboard: <T>() => getJson<T>('/api/leaderboard'),
  workoutSuggestions: <T>(userEmail = 'mona@example.com') =>
    getJson<T>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`),
};
