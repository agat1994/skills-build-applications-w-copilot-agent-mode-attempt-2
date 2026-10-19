import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
import { api } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Entry[] };

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    api.leaderboard<LeaderboardResponse>()
      .then((data) => active && setEntries(data.leaderboard))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : 'Request failed'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-label="Leaderboard">
      <CapabilityCard title="Leaderboard" description="Compare team point totals." />
      {loading && <p role="status" aria-live="polite">Loading leaderboard…</p>}
      {error && <p role="alert">Error: could not load leaderboard: {error}</p>}
      {!loading && !error && entries.length === 0 && <p role="status">No leaderboard entries yet.</p>}
      {!loading && !error && entries.length > 0 && (
        <ol aria-label="Leaderboard rankings">
          {entries.map((entry) => (
            <li key={entry.rank}>
              {entry.teamName}: {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
