export default function RewardsShelf({ rewards, pointsBalance }) {
  return (
    <div className="rewards-shelf">
      {rewards.map((reward) => {
        const unlocked = pointsBalance >= reward.points_cost;
        return (
          <div key={reward.id} className={`reward-chip ${unlocked ? 'reward-chip--unlocked' : ''}`}>
            <span className="reward-chip__icon">{reward.icon}</span>
            <span className="reward-chip__title">{reward.title}</span>
            <span className="reward-chip__cost">{reward.points_cost}⭐</span>
          </div>
        );
      })}
      {rewards.length === 0 && <p className="muted">No rewards set up yet — ask a parent to add some!</p>}
    </div>
  );
}
