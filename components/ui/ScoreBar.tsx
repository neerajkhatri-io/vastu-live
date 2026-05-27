import type { ScoreBand } from '@/lib/vastu';

interface ScoreBarProps {
  band: ScoreBand;
}

const SEGMENTS: { band: ScoreBand; label: string }[] = [
  { band: 'serious', label: 'Serious' },
  { band: 'needs-attention', label: 'Needs Attention' },
  { band: 'fair', label: 'Fair' },
  { band: 'good', label: 'Good' },
  { band: 'excellent', label: 'Excellent' },
];

const BAND_ORDER: ScoreBand[] = ['serious', 'needs-attention', 'fair', 'good', 'excellent'];

function getSegmentColor(seg: ScoreBand, active: boolean): string {
  if (!active) return 'transparent';
  if (seg === 'serious' || seg === 'needs-attention') return '#b91c1c';
  if (seg === 'fair') return '#b45309';
  return '#15803d';
}

function getBorderColor(seg: ScoreBand): string {
  if (seg === 'serious' || seg === 'needs-attention') return '#b91c1c';
  if (seg === 'fair') return '#b45309';
  return '#15803d';
}

export default function ScoreBar({ band }: ScoreBarProps) {
  const activeTier = BAND_ORDER.indexOf(band);

  return (
    <div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Vastu Health Score
      </p>
      <div className="flex gap-1.5">
        {SEGMENTS.map((seg, i) => {
          const active = i <= activeTier;
          const bg = getSegmentColor(seg.band, active);
          const border = getBorderColor(seg.band);
          return (
            <div
              key={seg.band}
              className="flex-1 h-3 rounded-full"
              style={{
                backgroundColor: bg,
                border: `2px solid ${border}`,
                opacity: active ? 1 : 0.3,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">Serious</span>
        <span className="text-xs text-gray-400">Excellent</span>
      </div>
      <p className="mt-1 text-sm font-semibold" style={{ color: getSegmentColor(band, true) }}>
        {SEGMENTS.find((s) => s.band === band)?.label}
      </p>
    </div>
  );
}
