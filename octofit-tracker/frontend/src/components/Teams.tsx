import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
import { api } from '../api/client.js';

interface Team {
  _id?: string;
  name: string;
  members: string[];
}

type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.teams<TeamsResponse>()
      .then((data) => {
        if (active) setTeams(data.teams);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load teams.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <CapabilityCard title="Teams" description="Manage teams and members." />
      {loading && <p role="status" aria-live="polite">Loading teams…</p>}
      {error && <p role="alert">Error: {error}</p>}
      {!loading && !error && teams.length === 0 ? (
        <p role="status">No teams found.</p>
      ) : !loading && !error && (
        <ul aria-label="Teams">
          {teams.map((team, index) => (
            <li key={team._id ?? index}>
              {team.name}
              {` (${team.members.length} members)`}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
