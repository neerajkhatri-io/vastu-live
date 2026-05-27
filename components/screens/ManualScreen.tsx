interface ManualScreenProps {
  onSelect: (shortCode: string) => void;
}

const DIRECTIONS = [
  { shortCode: 'N', name: 'North' },
  { shortCode: 'NE', name: 'Northeast' },
  { shortCode: 'E', name: 'East' },
  { shortCode: 'SE', name: 'Southeast' },
  { shortCode: 'S', name: 'South' },
  { shortCode: 'SW', name: 'Southwest' },
  { shortCode: 'W', name: 'West' },
  { shortCode: 'NW', name: 'Northwest' },
];

export default function ManualScreen({ onSelect }: ManualScreenProps) {
  return (
    <div className="flex flex-col h-full px-6 pt-10 pb-10">
      <div className="text-center mb-6">
        <h2
          className="text-3xl font-semibold text-gray-800 mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Select your entrance direction
        </h2>
        <p className="text-sm text-gray-500">
          Compass not available — tap your best estimate
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {DIRECTIONS.map(({ shortCode, name }) => (
            <button
              key={shortCode}
              onClick={() => onSelect(shortCode)}
              className="flex flex-col items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm active:opacity-70 transition-opacity"
              style={{ minHeight: '72px' }}
            >
              <span
                className="text-xl font-bold"
                style={{ color: '#C17F2B', fontFamily: 'var(--font-heading)' }}
              >
                {shortCode}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
