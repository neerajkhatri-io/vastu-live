import type { DirectionData } from '@/lib/vastu';

interface DirectionCardProps {
  directionData: DirectionData;
  heading?: number | null;
}

const STATUS_COLORS: Record<string, { border: string; badge: string; text: string }> = {
  best: { border: '#15803d', badge: '#dcfce7', text: '#15803d' },
  auspicious: { border: '#15803d', badge: '#dcfce7', text: '#15803d' },
  neutral: { border: '#b45309', badge: '#fef3c7', text: '#b45309' },
  inauspicious: { border: '#b91c1c', badge: '#fee2e2', text: '#b91c1c' },
  worst: { border: '#b91c1c', badge: '#fee2e2', text: '#b91c1c' },
};

const STATUS_LABEL: Record<string, string> = {
  best: '✨ Most Auspicious',
  auspicious: '✅ Auspicious',
  neutral: '◎ Neutral',
  inauspicious: '⚠️ Inauspicious',
  worst: '❌ Serious Concern',
};

export default function DirectionCard({ directionData, heading }: DirectionCardProps) {
  const colors = STATUS_COLORS[directionData.status] ?? STATUS_COLORS.neutral;

  return (
    <div
      className="rounded-2xl bg-white p-4 shadow-sm"
      style={{ border: `2px solid ${colors.border}` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'var(--font-heading)' }}>
            {directionData.name}
          </h3>
          {heading != null && (
            <p className="text-sm text-gray-400">{heading}°</p>
          )}
        </div>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full"
          style={{ backgroundColor: colors.badge, color: colors.text }}
        >
          {STATUS_LABEL[directionData.status]}
        </span>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-3">{directionData.reason}</p>

      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-gray-400 font-medium">Deity: </span>
          <span className="text-gray-700">{directionData.deity}</span>
        </div>
        <div>
          <span className="text-gray-400 font-medium">Element: </span>
          <span className="text-gray-700">{directionData.element}</span>
        </div>
      </div>
    </div>
  );
}
