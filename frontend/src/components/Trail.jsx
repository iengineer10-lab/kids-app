import { useEffect, useRef, useState } from 'react';

function buildSmoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 1} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const midX = (points[i - 1].x + points[i].x) / 2;
    const midY = (points[i - 1].y + points[i].y) / 2;
    d += ` Q ${points[i - 1].x} ${points[i - 1].y} ${midX} ${midY}`;
  }
  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

function truncate(str, max = 14) {
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

const WIDTH = 720;
const HEIGHT = 220;
const MARGIN = 70;

export default function Trail({ goals, overallPercent, kidPhotoUrl, kidName, onStationClick }) {
  const pathRef = useRef(null);
  const [avatarPos, setAvatarPos] = useState({ x: MARGIN, y: HEIGHT / 2 });

  const points = goals.map((goal, i) => {
    const x = goals.length === 1 ? WIDTH / 2 : MARGIN + (i * (WIDTH - 2 * MARGIN)) / (goals.length - 1);
    const y = HEIGHT / 2 + (i % 2 === 0 ? -55 : 55);
    return { x, y, goal };
  });

  const pathD = buildSmoothPath(points);

  useEffect(() => {
    if (pathRef.current && points.length > 0) {
      const len = pathRef.current.getTotalLength();
      const pt = pathRef.current.getPointAtLength(len * (Math.min(100, Math.max(0, overallPercent)) / 100));
      setAvatarPos({ x: pt.x, y: pt.y });
    }
  }, [overallPercent, goals.length]);

  if (points.length === 0) return null;

  return (
    <div className="trail">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + 50}`} className="trail__svg" role="img" aria-label="Quest trail">
        <path ref={pathRef} d={pathD} className="trail__path" fill="none" />

        {points.map((p, i) => {
          const done = p.goal.percent_complete >= 100;
          return (
            <g
              key={p.goal.id}
              className={`trail__station ${done ? 'trail__station--done' : ''}`}
              onClick={() => onStationClick && onStationClick(p.goal)}
            >
              <circle cx={p.x} cy={p.y} r="24" className="trail__station-circle" />
              <text x={p.x} y={p.y + 6} textAnchor="middle" className="trail__station-icon">
                {done ? '🏆' : i + 1}
              </text>
              <text x={p.x} y={p.y + 46} textAnchor="middle" className="trail__station-label">
                {truncate(p.goal.title)}
              </text>
            </g>
          );
        })}

        <g transform={`translate(${avatarPos.x}, ${avatarPos.y})`} className="trail__avatar">
          <circle r="27" className="trail__avatar-ring" />
          {kidPhotoUrl ? (
            <>
              <clipPath id="avatarClip">
                <circle r="23" />
              </clipPath>
              <image href={kidPhotoUrl} x="-23" y="-23" width="46" height="46" clipPath="url(#avatarClip)" />
            </>
          ) : (
            <text textAnchor="middle" dy="9" className="trail__avatar-initial">
              {kidName.charAt(0).toUpperCase()}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
