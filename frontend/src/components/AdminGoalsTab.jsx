import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function AdminGoalsTab() {
  const [kids, setKids] = useState([]);
  const [selectedKidId, setSelectedKidId] = useState('');
  const [goals, setGoals] = useState([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [taskDrafts, setTaskDrafts] = useState({}); // goalId -> { title, points }
  const [error, setError] = useState('');

  useEffect(() => {
    api.getKids().then((k) => {
      setKids(k);
      if (k.length > 0) setSelectedKidId(String(k[0].id));
    });
  }, []);

  const loadGoals = (kidId) => {
    if (!kidId) return;
    api
      .getKidGoals(kidId)
      .then(setGoals)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    loadGoals(selectedKidId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKidId]);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    setError('');
    try {
      await api.createGoal({ kid_id: Number(selectedKidId), title: newGoalTitle, description: newGoalDesc });
      setNewGoalTitle('');
      setNewGoalDesc('');
      loadGoals(selectedKidId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteGoal = async (goal) => {
    if (!confirm(`Delete goal "${goal.title}" and all its tasks?`)) return;
    await api.deleteGoal(goal.id);
    loadGoals(selectedKidId);
  };

  const handleAddTask = async (goalId) => {
    const draft = taskDrafts[goalId];
    if (!draft || !draft.title || !draft.title.trim()) return;
    setError('');
    try {
      await api.createTask({
        goal_id: goalId,
        title: draft.title,
        points_value: Number(draft.points) || 5,
      });
      setTaskDrafts((d) => ({ ...d, [goalId]: { title: '', points: '' } }));
      loadGoals(selectedKidId);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleTask = async (task) => {
    await api.toggleTask(task.id);
    loadGoals(selectedKidId);
  };

  const handleDeleteTask = async (task) => {
    await api.deleteTask(task.id);
    loadGoals(selectedKidId);
  };

  return (
    <div className="admin-tab">
      <label className="field">
        <span>Kid</span>
        <select value={selectedKidId} onChange={(e) => setSelectedKidId(e.target.value)}>
          {kids.map((kid) => (
            <option key={kid.id} value={kid.id}>
              {kid.name}
            </option>
          ))}
        </select>
      </label>

      {kids.length === 0 && <p className="muted">Add a kid first on the Kids tab.</p>}
      {error && <p className="error">{error}</p>}

      {selectedKidId && (
        <>
          <form className="admin-form" onSubmit={handleAddGoal}>
            <h3>Add a goal</h3>
            <div className="admin-form__row">
              <label className="field">
                <span>Title</span>
                <input value={newGoalTitle} onChange={(e) => setNewGoalTitle(e.target.value)} required />
              </label>
              <label className="field">
                <span>Description (optional)</span>
                <input value={newGoalDesc} onChange={(e) => setNewGoalDesc(e.target.value)} />
              </label>
            </div>
            <button className="button button--primary" type="submit">
              Add goal
            </button>
          </form>

          <div className="admin-goal-list">
            {goals.map((goal) => (
              <div key={goal.id} className="admin-goal-card">
                <div className="admin-goal-card__header">
                  <h4>{goal.title}</h4>
                  <span className="muted">{goal.percent_complete}% complete</span>
                  <button className="button button--danger button--small" onClick={() => handleDeleteGoal(goal)}>
                    Delete goal
                  </button>
                </div>

                <ul className="admin-task-list">
                  {goal.tasks.map((task) => (
                    <li key={task.id} className="admin-task-list__item">
                      <button
                        className={`checkbox ${task.is_done ? 'checkbox--checked' : ''}`}
                        onClick={() => handleToggleTask(task)}
                        title="Toggle done"
                      >
                        {task.is_done ? '✅' : '⬜'}
                      </button>
                      <span className="admin-task-list__title">{task.title}</span>
                      <span className="admin-task-list__points">{task.points_value}⭐</span>
                      <button className="button button--danger button--small" onClick={() => handleDeleteTask(task)}>
                        Remove
                      </button>
                    </li>
                  ))}
                  {goal.tasks.length === 0 && <li className="muted">No tasks yet.</li>}
                </ul>

                <div className="admin-form__row admin-form__row--tight">
                  <input
                    placeholder="New task"
                    value={taskDrafts[goal.id]?.title || ''}
                    onChange={(e) =>
                      setTaskDrafts((d) => ({ ...d, [goal.id]: { ...d[goal.id], title: e.target.value } }))
                    }
                  />
                  <input
                    type="number"
                    placeholder="Points"
                    className="admin-form__points-input"
                    value={taskDrafts[goal.id]?.points || ''}
                    onChange={(e) =>
                      setTaskDrafts((d) => ({ ...d, [goal.id]: { ...d[goal.id], points: e.target.value } }))
                    }
                  />
                  <button className="button" onClick={() => handleAddTask(goal.id)}>
                    Add task
                  </button>
                </div>
              </div>
            ))}
            {goals.length === 0 && <p className="muted">No goals yet for this kid.</p>}
          </div>
        </>
      )}
    </div>
  );
}
