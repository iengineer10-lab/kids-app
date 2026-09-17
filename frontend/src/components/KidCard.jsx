export default function KidCard({ kid, onClick }) {
  return (
    <button className="kid-card" onClick={onClick}>
      <div className="kid-card__photo">
        {kid.photo_url ? (
          <img src={kid.photo_url} alt={kid.name} />
        ) : (
          <span className="kid-card__initial">{kid.name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="kid-card__name">{kid.name}</div>
      <div className="kid-card__age">Age {kid.age}</div>
      <div className="kid-card__points">⭐ {kid.points_balance} pts</div>
    </button>
  );
}
