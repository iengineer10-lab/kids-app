import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyForm = { name: '', age: '', photo_url: '' };

export default function AdminKidsTab() {
  const [kids, setKids] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.getKids().then(setKids).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await api.uploadPhoto(file);
      setForm((f) => ({ ...f, photo_url: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { name: form.name, age: Number(form.age), photo_url: form.photo_url || null };
      if (editingId) {
        await api.updateKid(editingId, payload);
      } else {
        await api.createKid(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (kid) => {
    setEditingId(kid.id);
    setForm({ name: kid.name, age: String(kid.age), photo_url: kid.photo_url || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (kid) => {
    if (!confirm(`Delete ${kid.name}? This also removes their goals and tasks.`)) return;
    await api.deleteKid(kid.id);
    load();
  };

  return (
    <div className="admin-tab">
      <form className="admin-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit kid' : 'Add a kid'}</h3>
        <div className="admin-form__row">
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="field field--narrow">
            <span>Age</span>
            <input
              type="number"
              min="0"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              required
            />
          </label>
        </div>
        <label className="field">
          <span>Photo</span>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </label>
        {uploading && <p className="muted">Uploading photo…</p>}
        {form.photo_url && (
          <img src={form.photo_url} alt="Preview" className="admin-form__photo-preview" />
        )}
        {error && <p className="error">{error}</p>}
        <div className="admin-form__actions">
          <button className="button button--primary" type="submit">
            {editingId ? 'Save changes' : 'Add kid'}
          </button>
          {editingId && (
            <button type="button" className="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="admin-list">
        {kids.map((kid) => (
          <div key={kid.id} className="admin-list__row">
            <div className="admin-list__photo">
              {kid.photo_url ? <img src={kid.photo_url} alt={kid.name} /> : kid.name.charAt(0)}
            </div>
            <div className="admin-list__info">
              <strong>{kid.name}</strong>
              <span className="muted"> · age {kid.age} · ⭐ {kid.points_balance} pts</span>
            </div>
            <div className="admin-list__actions">
              <button className="button" onClick={() => startEdit(kid)}>
                Edit
              </button>
              <button className="button button--danger" onClick={() => handleDelete(kid)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {kids.length === 0 && <p className="muted">No kids added yet.</p>}
      </div>
    </div>
  );
}
