import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Trail from '../components/Trail.jsx';
import GoalChecklist from '../components/GoalChecklist.jsx';
import RewardsShelf from '../components/RewardsShelf.jsx';
import { api } from '../api.js';

export default function KidProgressPage() {
  const { id } = useParams();
  const [progress, setProgress] = useState(null);
  const [goals, setGoals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([api.getKidProgress(id), api.getKidGoals(id), api.getRewards()])
      .then(([progressData, goalsData, rewardsData]) => {
        setProgress(progressData);
        setGoals(goalsData);
        setRewards(rewardsData);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <p className="error">{error}</p>
        <Link to="/" className="link-button">
          ← Back to profiles
        </Link>
      </div>
    );
  }

  if (!progress) return <div className="page">Loading…</div>;

  return (
    <div className="page page--progress">
      <Link to="/" className="back-link">
        ← Everyone
      </Link>
      <h1 className="page__title">{progress.kid.name}'s quest trail</h1>
      <p className="page__subtitle">
        {progress.earned_points} of {progress.total_points} points earned · ⭐ {progress.kid.points_balance} to spend
      </p>

      <Trail
        goals={progress.goals}
        overallPercent={progress.overall_percent}
        kidPhotoUrl={progress.kid.photo_url}
        kidName={progress.kid.name}
        onStationClick={(goal) => {
          const el = document.getElementById(`goal-${goal.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      />

      <section className="section">
        <h2 className="section__title">Goals</h2>
        <div className="goal-checklist-grid">
          {goals.map((goal) => (
            <GoalChecklist key={goal.id} goal={goal} />
          ))}
          {goals.length === 0 && <p className="muted">No goals set yet — check back soon!</p>}
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Rewards shelf</h2>
        <RewardsShelf rewards={rewards} pointsBalance={progress.kid.points_balance} />
      </section>
    </div>
  );
}
