import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyForm = { title: '', points_cost: '', icon: '🎁' };

export default function AdminRewardsTab() {
  const [rewards, setRewards] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [kids, setKids] = useState([]);
  const [redeemKidId, setRedeemKidId] = useState('');
  const [redeemRewardId, setRedeemRewardId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRewards = () => api.getRewards().then(setRewards);
  const loadKids = () => api.getKids().then(setKids);

  useEffect(() => {
    loadRewards();
    loadKids();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { title: form.title, points_cost: Number(form.points_cost), icon: form.icon || '🎁' };
      if (editingId) await api.updateReward(editingId, payload);
      else await api.createReward(payload);
      setForm(emptyForm);
      setEditingId(null);
      loadRewards();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (reward) => {
    setEditingId(reward.id);
    setForm({ title: reward.title, points_cost: String(reward.points_cost), icon: reward.icon });
  };

  const handleDelete = async (reward) => {
    if (!confirm(`Delete reward "${reward.title}"?`)) return;
    await api.deleteReward(reward.id);
    loadRewards();
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!redeemKidId || !redeemRewardId) return;
    try {
      const updatedKid = await api.redeemReward(redeemKidId, Number(redeemRewardId));
      setMessage(`Redeemed! ${updatedKid.name} now has ${updatedKid.points_balance} points left.`);
      loadKids();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-tab">
      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit reward' : 'Add a reward'}</h3>
        <div className="admin-form__row">
          <label className="field field--narrow">
            <span>Icon</span>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={2} />
          </label>
          <label className="field">
            <span>Title</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="field field--narrow">
            <span>Points cost</span>
            <input
              type="number"
              min="1"
              value={form.points_cost}
              onChange={(e) => setForm({ ...form, points_cost: e.target.value })}
              required
            />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="admin-form__actions">
          <button className="button button--primary" type="submit">
            {editingId ? 'Save changes' : 'Add reward'}
          </button>
          {editingId && (
            <button
              type="button"
              className="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin-list">
        {rewards.map((reward) => (
          <div key={reward.id} className="admin-list__row">
            <span className="admin-list__reward-icon">{reward.icon}</span>
            <div className="admin-list__info">
              <strong>{reward.title}</strong>
              <span className="muted"> · {reward.points_cost} pts</span>
            </div>
            <div className="admin-list__actions">
              <button className="button" onClick={() => startEdit(reward)}>
                Edit
              </button>
              <button className="button button--danger" onClick={() => handleDelete(reward)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {rewards.length === 0 && <p className="muted">No rewards yet.</p>}
      </div>

      <form className="admin-form" onSubmit={handleRedeem}>
        <h3>Redeem a reward</h3>
        <div className="admin-form__row">
          <label className="field">
            <span>Kid</span>
            <select value={redeemKidId} onChange={(e) => setRedeemKidId(e.target.value)}>
              <option value="">Choose a kid…</option>
              {kids.map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.name} ({kid.points_balance} pts)
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Reward</span>
            <select value={redeemRewardId} onChange={(e) => setRedeemRewardId(e.target.value)}>
              <option value="">Choose a reward…</option>
              {rewards.map((reward) => (
                <option key={reward.id} value={reward.id}>
                  {reward.icon} {reward.title} ({reward.points_cost} pts)
                </option>
              ))}
            </select>
          </label>
        </div>
        {message && <p className="success">{message}</p>}
        <button className="button button--primary" type="submit">
          Redeem
        </button>
      </form>
    </div>
  );
}
