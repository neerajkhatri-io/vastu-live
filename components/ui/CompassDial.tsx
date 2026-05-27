'use client';

interface CompassDialProps {
  heading: number | null;
}

const LABELS = [
  { label: 'N', angle: 0, cardinal: true },
  { label: 'NE', angle: 45, cardinal: false },
  { label: 'E', angle: 90, cardinal: true },
  { label: 'SE', angle: 135, cardinal: false },
  { label: 'S', angle: 180, cardinal: true },
  { label: 'SW', angle: 225, cardinal: false },
  { label: 'W', angle: 270, cardinal: true },
  { label: 'NW', angle: 315, cardinal: false },
];

export default function CompassDial({ heading }: CompassDialProps) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 128;
  const innerR = 108;
  const labelR = 118;

  // Needle rotation: heading=0 means north (top), so we rotate by heading degrees
  const needleRotation = heading ?? 0;

  const labelPositions = LABELS.map(({ label, angle, cardinal }) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    // Labels are on a ring — dial rotates with heading, so labels stay fixed
    const x = cx + labelR * Math.cos(rad);
    const y = cy + labelR * Math.sin(rad);
    return { label, x, y, cardinal };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-md"
        aria-label="Compass dial"
      >
        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={outerR}
          fill="white"
          stroke="#e5e7eb"
          strokeWidth="2"
        />

        {/* Tick marks */}
        {Array.from({ length: 72 }).map((_, i) => {
          const a = (i * 5 * Math.PI) / 180;
          const isMajor = i % 9 === 0;
          const rOuter = outerR - 2;
          const rInner = isMajor ? outerR - 14 : outerR - 8;
          return (
            <line
              key={i}
              x1={cx + rOuter * Math.sin(a)}
              y1={cy - rOuter * Math.cos(a)}
              x2={cx + rInner * Math.sin(a)}
              y2={cy - rInner * Math.cos(a)}
              stroke={isMajor ? '#9ca3af' : '#d1d5db'}
              strokeWidth={isMajor ? 1.5 : 0.75}
            />
          );
        })}

        {/* Inner circle */}
        <circle cx={cx} cy={cy} r={innerR} fill="#faf8f5" stroke="#e5e7eb" strokeWidth="1" />

        {/* Direction labels — fixed, compass ring rotates underneath */}
        {labelPositions.map(({ label, x, y, cardinal }) => (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={cardinal ? 14 : 11}
            fontWeight={cardinal ? '700' : '500'}
            fill={label === 'N' ? '#C17F2B' : '#374151'}
            fontFamily="Inter, sans-serif"
          >
            {label}
          </text>
        ))}

        {/* Needle group — rotates based on heading */}
        <g
          transform={`rotate(${needleRotation}, ${cx}, ${cy})`}
          style={{
            transition: heading !== null ? 'transform 0.3s ease-out' : undefined,
            opacity: heading === null ? undefined : 1,
          }}
          className={heading === null ? 'animate-pulse' : ''}
        >
          {/* North (red) needle */}
          <polygon
            points={`${cx},${cy - 80} ${cx - 7},${cy + 10} ${cx + 7},${cy + 10}`}
            fill="#C17F2B"
            stroke="white"
            strokeWidth="1"
          />
          {/* South (gray) needle */}
          <polygon
            points={`${cx},${cy + 80} ${cx - 7},${cy - 10} ${cx + 7},${cy - 10}`}
            fill="#9ca3af"
            stroke="white"
            strokeWidth="1"
          />
        </g>

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={6} fill="#374151" stroke="white" strokeWidth="2" />
      </svg>

      {/* Heading readout */}
      <div className="text-center">
        {heading !== null ? (
          <p className="text-3xl font-bold text-gray-800 tracking-tight">
            {heading}°&nbsp;&nbsp;
            <span style={{ color: '#C17F2B' }}>
              {LABELS.find((l) => {
                const diff = Math.abs(((heading - l.angle + 540) % 360) - 180);
                return diff < 22.5;
              })?.label ?? ''}
            </span>
          </p>
        ) : (
          <p className="text-lg text-gray-400 animate-pulse">Searching for compass…</p>
        )}
      </div>
    </div>
  );
}
