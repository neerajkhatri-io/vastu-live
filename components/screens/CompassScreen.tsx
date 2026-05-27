import type { CompassState } from '@/hooks/useCompass';
import CompassDial from '@/components/ui/CompassDial';

interface CompassScreenProps {
  compassState: CompassState;
  onLock: (heading: number, shortCode: string) => void;
}

export default function CompassScreen({ compassState, onLock }: CompassScreenProps) {
  const { heading, direction, shortCode } = compassState;
  const canLock = heading !== null && shortCode !== null;

  const handleLock = () => {
    if (canLock) onLock(heading!, shortCode!);
  };

  return (
    <div className="flex flex-col h-full px-6 pt-8 pb-10">
      <p className="text-center text-sm font-medium text-gray-500 mb-6 tracking-wide uppercase">
        Point toward your main entrance
      </p>

      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <CompassDial heading={heading} />

        <div className="text-center mt-2">
          {direction ? (
            <p
              className="text-2xl font-semibold text-gray-700"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Facing: {direction} ({shortCode})
            </p>
          ) : (
            <p className="text-lg text-gray-400">Waiting for compass…</p>
          )}
        </div>
      </div>

      <div className="max-w-sm w-full mx-auto">
        <button
          onClick={handleLock}
          disabled={!canLock}
          className="w-full py-4 rounded-2xl text-white text-lg font-semibold transition-opacity"
          style={{
            backgroundColor: canLock ? '#C17F2B' : '#d1d5db',
            minHeight: '56px',
            color: canLock ? 'white' : '#9ca3af',
          }}
        >
          {canLock ? 'Lock This Direction →' : 'Waiting for compass…'}
        </button>
      </div>
    </div>
  );
}
