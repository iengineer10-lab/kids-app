export default function GoalChecklist({ goal }) {
  return (
    <div className="goal-checklist" id={`goal-${goal.id}`}>
      <div className="goal-checklist__header">
        <h3>{goal.title}</h3>
        <span className="goal-checklist__percent">{goal.percent_complete}%</span>
      </div>
      {goal.description && <p className="goal-checklist__description">{goal.description}</p>}
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${goal.percent_complete}%` }} />
      </div>
      <ul className="task-list">
        {goal.tasks.map((task) => (
          <li key={task.id} className={`task-list__item ${task.is_done ? 'task-list__item--done' : ''}`}>
            <span className="task-list__check">{task.is_done ? '✅' : '⬜'}</span>
            <span className="task-list__title">{task.title}</span>
            <span className="task-list__points">+{task.points_value}⭐</span>
          </li>
        ))}
        {goal.tasks.length === 0 && <li className="task-list__empty">No tasks yet.</li>}
      </ul>
    </div>
  );
}
