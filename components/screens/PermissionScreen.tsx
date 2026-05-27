interface PermissionScreenProps {
  onRequestPermission: () => void;
  onManual: () => void;
}

export default function PermissionScreen({ onRequestPermission, onManual }: PermissionScreenProps) {
  return (
    <div className="flex flex-col h-full px-6 pt-16 pb-10">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="text-6xl select-none">📱🧭</div>

        <div>
          <h2
            className="text-3xl font-semibold text-gray-800 mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Allow compass access
          </h2>
          <p className="text-base text-gray-600 leading-relaxed max-w-xs">
            To detect your gate direction, we need access to your phone&apos;s compass.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-xs text-left">
          <p className="text-sm text-amber-800 leading-relaxed">
            🔒 Your location is <strong>never</strong> recorded or shared. The compass only detects which direction you are pointing.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-sm w-full mx-auto">
        <button
          onClick={onRequestPermission}
          className="w-full py-4 rounded-2xl text-white text-lg font-semibold active:opacity-80 transition-opacity"
          style={{ backgroundColor: '#C17F2B', minHeight: '56px' }}
        >
          Allow Access
        </button>
        <button
          onClick={onManual}
          className="w-full py-3 text-base font-medium text-gray-500 underline active:opacity-70 transition-opacity"
          style={{ minHeight: '44px' }}
        >
          Enter direction manually instead
        </button>
      </div>
    </div>
  );
}
