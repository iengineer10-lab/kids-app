import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import KidCard from '../components/KidCard.jsx';
import { api } from '../api.js';

export default function KidCardsPage() {
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getKids()
      .then(setKids)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page page--cards">
      <h1 className="page__title">Who's on a quest today?</h1>
      <p className="page__subtitle">Tap your picture to see your goals and progress.</p>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && kids.length === 0 && (
        <p className="muted">
          No kids yet. Head to <strong>Parent / Admin</strong> to add the first profile.
        </p>
      )}

      <div className="kid-card-grid">
        {kids.map((kid) => (
          <KidCard key={kid.id} kid={kid} onClick={() => navigate(`/kid/${kid.id}`)} />
        ))}
      </div>
    </div>
  );
}
