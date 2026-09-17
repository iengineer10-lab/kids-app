import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../api.js';
import AdminKidsTab from '../components/AdminKidsTab.jsx';
import AdminGoalsTab from '../components/AdminGoalsTab.jsx';
import AdminRewardsTab from '../components/AdminRewardsTab.jsx';

const TABS = [
  { id: 'kids', label: 'Kids' },
  { id: 'goals', label: 'Goals & Tasks' },
  { id: 'rewards', label: 'Rewards & Redeem' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('kids');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) navigate('/admin/login');
  }, [navigate]);

  if (!isLoggedIn()) return null;

  return (
    <div className="page page--admin">
      <h1 className="page__title">Admin dashboard</h1>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tabs__button ${tab === t.id ? 'tabs__button--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {tab === 'kids' && <AdminKidsTab />}
        {tab === 'goals' && <AdminGoalsTab />}
        {tab === 'rewards' && <AdminRewardsTab />}
      </div>
    </div>
  );
}
