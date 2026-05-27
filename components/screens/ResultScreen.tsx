'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DirectionData, ScoreResult } from '@/lib/vastu';
import { getTips } from '@/lib/vastu';
import { QUESTIONS } from '@/lib/questions';
import DirectionCard from '@/components/ui/DirectionCard';
import ScoreBar from '@/components/ui/ScoreBar';

interface ResultScreenProps {
  directionData: DirectionData;
  heading: number | null;
  answers: Record<string, boolean>;
  scoreResult: ScoreResult;
  onRetake: () => void;
}

const VERDICT: Record<string, { icon: string; text: string; bg: string; textColor: string }> = {
  excellent: { icon: '✅', text: 'Your entrance is Vastu-friendly', bg: '#dcfce7', textColor: '#15803d' },
  good: { icon: '✅', text: 'Your entrance is Vastu-friendly', bg: '#dcfce7', textColor: '#15803d' },
  fair: { icon: '⚠️', text: 'Some things to be aware of', bg: '#fef3c7', textColor: '#b45309' },
  'needs-attention': { icon: '⚠️', text: 'Some things to be aware of', bg: '#fef3c7', textColor: '#b45309' },
  serious: { icon: '❌', text: 'Your entrance has Vastu concerns', bg: '#fee2e2', textColor: '#b91c1c' },
};

interface AiContent {
  reading: string;
  tips: string[];
}

export default function ResultScreen({
  directionData,
  heading,
  answers,
  scoreResult,
  onRetake,
}: ResultScreenProps) {
  const verdict = VERDICT[scoreResult.band];
  const staticTips = getTips(directionData, scoreResult);

  const [aiContent, setAiContent] = useState<AiContent | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    setAiLoading(true);
    setAiError(false);

    fetch('/api/vastu-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: directionData, answers, scoreResult }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        return res.json();
      })
      .then((data: AiContent) => {
        if (!cancelled && data.reading && Array.isArray(data.tips)) {
          setAiContent(data);
        } else if (!cancelled) {
          setAiError(true);
        }
      })
      .catch(() => { if (!cancelled) setAiError(true); })
      .finally(() => { clearTimeout(timeout); if (!cancelled) setAiLoading(false); });

    return () => { cancelled = true; controller.abort(); clearTimeout(timeout); };
  }, [directionData, answers, scoreResult]);

  const tips = aiContent?.tips ?? staticTips;
  const isAI = !!aiContent;

  const handleShare = useCallback(async () => {
    const text = [
      `🧭 Vastu Check Report`,
      `Gate Direction: ${directionData.name} (${directionData.shortCode})${heading ? ` — ${heading}°` : ''}`,
      `Status: ${verdict.text}`,
      `Score: ${scoreResult.label}`,
      ``,
      aiContent?.reading ?? directionData.reason,
      ``,
      `What to do next:`,
      ...tips.map((t, i) => `${i + 1}. ${t}`),
      ``,
      `Checked with Vastu Check app`,
    ].join('\n');

    if (navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      alert('Report copied to clipboard!');
    } catch {
      alert('Could not share — please copy manually.');
    }
  }, [directionData, heading, verdict, scoreResult, aiContent, tips]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header verdict strip */}
      <div className="px-6 py-5 text-center" style={{ backgroundColor: verdict.bg }}>
        <p className="text-3xl mb-1">{verdict.icon}</p>
        <h2
          className="text-xl font-semibold"
          style={{ color: verdict.textColor, fontFamily: 'var(--font-heading)' }}
        >
          {verdict.text}
        </h2>
      </div>

      <div className="flex-1 px-6 py-6 flex flex-col gap-6">
        {/* Gate direction card */}
        <DirectionCard directionData={directionData} heading={heading} />

        {/* AI personal reading */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ isolation: 'isolate' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Your Personal Reading
            </h3>
            {!aiLoading && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={isAI
                  ? { backgroundColor: '#fef3c7', color: '#b45309' }
                  : { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                }
              >
                {isAI ? '✨ AI personalised' : 'Standard'}
              </span>
            )}
          </div>
          <div style={{ minHeight: '60px' }}>
            {aiLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">
                {aiContent?.reading ?? directionData.reason}
              </p>
            )}
          </div>
        </div>

        {/* Answers review */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Your Answers
          </h3>
          <div className="flex flex-col gap-2">
            {QUESTIONS.map((q) => {
              const ans = answers[q.id];
              const implication = ans ? q.yesImplication : q.noImplication;
              return (
                <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{ans ? '✓' : '✗'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700 leading-snug">{q.text}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{implication}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <ScoreBar band={scoreResult.band} />
        </div>

        {/* Tips */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              What to do next
            </h3>
            {!aiLoading && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={isAI
                  ? { backgroundColor: '#fef3c7', color: '#b45309' }
                  : { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                }
              >
                {isAI ? '✨ AI personalised' : 'Standard'}
              </span>
            )}
          </div>
          {aiLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tips.map((tip, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3">
                  <span className="text-base font-bold flex-shrink-0 mt-0.5" style={{ color: '#C17F2B' }}>
                    {i + 1}.
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                </div>
              ))}
              {aiError && (
                <p className="text-xs text-center text-gray-400 mt-1">
                  Could not reach AI — showing standard advice
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pb-6">
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-2xl text-white text-base font-semibold active:opacity-80 transition-opacity"
            style={{ backgroundColor: '#C17F2B', minHeight: '56px' }}
          >
            Share Report 📤
          </button>
          <button
            onClick={onRetake}
            className="w-full py-4 rounded-2xl text-gray-600 text-base font-semibold bg-gray-100 active:opacity-70 transition-opacity"
            style={{ minHeight: '56px' }}
          >
            Check Another Entrance
          </button>
        </div>
      </div>
    </div>
  );
}
