interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col h-full px-6 pt-16 pb-10">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="text-7xl select-none">🧭</div>

        <div>
          <h1
            className="text-5xl font-semibold text-gray-800 leading-tight mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: '#C17F2B' }}
          >
            Vastu Check
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Stand at the center of your home
          </p>
        </div>

        <p className="text-base text-gray-500 max-w-xs leading-relaxed">
          Point your phone toward the main entrance. We&apos;ll use your compass to check your gate direction.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onStart}
          className="w-full max-w-sm py-4 rounded-2xl text-white text-lg font-semibold active:opacity-80 transition-opacity"
          style={{ backgroundColor: '#C17F2B', minHeight: '56px' }}
        >
          Begin Check →
        </button>
        <p className="text-xs text-gray-400">Works best indoors. Keep phone flat and level.</p>
      </div>
    </div>
  );
}
