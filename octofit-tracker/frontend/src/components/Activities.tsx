import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
import { api } from '../api/client.js';

type Activity = {
  _id?: string;
  type: string;
  minutes: number;
  points?: number;
};

type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.activities<ActivitiesResponse>()
      .then((data) => {
        if (active) setItems(data.activities);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load activities.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-label="Activities">
      <CapabilityCard title="Activities" description="Track student activity minutes and points." />
      {loading && <p role="status" aria-live="polite">Loading activities…</p>}
      {error && <p role="alert">Error: {error}</p>}
      {!loading && !error && items.length === 0 && <p role="status">No activities found.</p>}
      {!loading && !error && items.length > 0 && (
        <ul aria-label="Activities list">
          {items.map((activity, index) => (
            <li key={activity._id ?? index}>
              {activity.type}
              {` – ${activity.minutes} min`}
              {activity.points !== undefined && ` – ${activity.points} pts`}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
