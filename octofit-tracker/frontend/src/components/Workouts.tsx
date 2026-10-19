import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
import { api } from '../api/client.js';

type Workout = {
  _id?: string;
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
};
type WorkoutsResponse = { suggestions: Workout[] };

export default function Workouts() {
  const [items, setItems] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.workoutSuggestions<WorkoutsResponse>()
      .then((data) => {
        if (active) setItems(data.suggestions);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load workouts');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  let body;
  if (error) body = <p role="alert">Error: {error}</p>;
  else if (loading) body = <p role="status" aria-live="polite">Loading workout suggestions…</p>;
  else if (items.length === 0) body = <p role="status">No workout suggestions available.</p>;
  else
    body = (
      <ul aria-label="Workout suggestions">
        {items.map((workout, index) => (
          <li key={workout._id ?? index}>
            <strong>{workout.title}</strong>
            {` – ${workout.focus}, ${workout.minutes} min, ${workout.difficulty}`}
            {` – ${workout.reason}`}
          </li>
        ))}
      </ul>
    );

  return (
    <section>
      <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." />
      {body}
    </section>
  );
}
