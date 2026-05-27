'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
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
  const [pdfGenerating, setPdfGenerating] = useState(false);

  // Capture props at mount time — never re-run this effect.
  // directionData/answers/scoreResult are objects whose references change on
  // every parent render (compass heading updates), which would re-trigger the
  // call on every tick. We only ever want ONE call per result screen mount.
  const initRef = useRef({ directionData, answers, scoreResult, heading });

  useEffect(() => {
    const { directionData: dir, answers: ans, scoreResult: score } = initRef.current;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch('/api/vastu-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction: dir, answers: ans, scoreResult: score }),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — call exactly once on mount

  const tips = aiContent?.tips ?? staticTips;
  const isAI = !!aiContent;

  const generatePDF = useCallback(async () => {
    setPdfGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');

      const { directionData: dir, answers: ans, scoreResult: score, heading: h } = initRef.current;
      const W = 210, H = 297;
      const M = 14;
      const CW = W - M * 2;
      let y = 0;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Warm off-white background
      doc.setFillColor(250, 248, 245);
      doc.rect(0, 0, W, H, 'F');

      // Load logo once for reuse
      let logoB64: string | null = null;
      try {
        const resp = await fetch('/logo.png');
        const blob = await resp.blob();
        logoB64 = await new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.readAsDataURL(blob);
        });
      } catch { /* logo optional */ }

      // Draw a new background on page N and reset y
      const newPage = () => {
        doc.addPage();
        doc.setFillColor(250, 248, 245);
        doc.rect(0, 0, W, H, 'F');
        y = 14;
      };

      const checkBreak = (needed: number) => {
        if (y + needed > H - 40) newPage();
      };

      const sectionLabel = (text: string) => {
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(160, 140, 110);
        doc.text(text.toUpperCase(), M, y + 4);
        y += 7;
      };

      // ── HEADER ───────────────────────────────────────────────────────
      doc.setFillColor(193, 127, 43);
      doc.rect(0, 0, W, 36, 'F');
      doc.setFillColor(220, 155, 65);
      doc.rect(0, 0, W, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(21);
      doc.setTextColor(255, 255, 255);
      doc.text('VASTU CHECK', M, 16);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 240, 210);
      doc.text('Personal Entrance Report', M, 23);

      doc.setFontSize(7.5);
      doc.setTextColor(255, 228, 175);
      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(today, M, 30);

      if (logoB64) {
        doc.addImage(logoB64, 'PNG', W - M - 26, 4, 26, 28);
      }

      y = 42;

      // ── VERDICT STRIP ────────────────────────────────────────────────
      const vBgMap: Record<string, [number, number, number]> = {
        excellent: [220, 252, 231], good: [220, 252, 231],
        fair: [254, 243, 199], 'needs-attention': [254, 243, 199],
        serious: [254, 226, 226],
      };
      const vFgMap: Record<string, [number, number, number]> = {
        excellent: [21, 128, 61], good: [21, 128, 61],
        fair: [180, 83, 9], 'needs-attention': [180, 83, 9],
        serious: [185, 28, 28],
      };
      const vBg = vBgMap[score.band] ?? [220, 252, 231];
      const vFg = vFgMap[score.band] ?? [21, 128, 61];

      doc.setFillColor(...vBg);
      doc.roundedRect(M, y, CW, 13, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...vFg);
      doc.text(verdict.text, M + 5, y + 9);

      y += 19;

      // ── DIRECTION CARD ───────────────────────────────────────────────
      checkBreak(36);
      sectionLabel('Gate Direction');

      const statusColorMap: Record<string, [number, number, number]> = {
        best: [21, 128, 61], auspicious: [21, 128, 61],
        neutral: [180, 83, 9], inauspicious: [185, 28, 28], worst: [185, 28, 28],
      };
      const dirC = statusColorMap[dir.status] ?? [100, 100, 100];

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(M, y, CW, 27, 2, 2, 'F');
      doc.setDrawColor(...dirC);
      doc.setLineWidth(0.5);
      doc.roundedRect(M, y, CW, 27, 2, 2, 'S');

      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 40, 30);
      doc.text(dir.name, M + 5, y + 11);

      const nameW = doc.getTextWidth(dir.name);
      doc.setFillColor(...dirC);
      doc.roundedRect(M + 5 + nameW + 2, y + 4, 11, 6, 1.5, 1.5, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(dir.shortCode, M + 5 + nameW + 7.5, y + 8.5, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 88, 72);
      const bearingStr = h ? `${Math.round(h)}°` : dir.shortCode;
      doc.text(`Deity: ${dir.deity}  •  Element: ${dir.element}  •  Bearing: ${bearingStr}`, M + 5, y + 18);

      const reasonLines = doc.splitTextToSize(dir.reason, CW - 12);
      doc.setFontSize(7.5);
      doc.setTextColor(70, 60, 50);
      doc.text(reasonLines[0], M + 5, y + 24);

      y += 33;

      // ── SCORE BAR ────────────────────────────────────────────────────
      checkBreak(24);
      sectionLabel('Overall Vastu Score');

      type RGB = [number, number, number];
      const segDefs: { key: string; label: string; active: RGB; activeTxt: RGB }[] = [
        { key: 'serious',          label: 'Serious',      active: [185, 28, 28],  activeTxt: [255, 255, 255] },
        { key: 'needs-attention',  label: 'Needs Attn',   active: [185, 28, 28],  activeTxt: [255, 255, 255] },
        { key: 'fair',             label: 'Fair',         active: [180, 83, 9],   activeTxt: [255, 255, 255] },
        { key: 'good',             label: 'Good',         active: [21, 128, 61],  activeTxt: [255, 255, 255] },
        { key: 'excellent',        label: 'Excellent',    active: [21, 128, 61],  activeTxt: [255, 255, 255] },
      ];
      const segW = CW / 5;
      segDefs.forEach((s, i) => {
        const on = s.key === score.band;
        const bx = M + i * segW;
        if (on) {
          doc.setFillColor(...s.active);
          doc.setDrawColor(...s.active);
        } else {
          doc.setFillColor(242, 240, 235);
          doc.setDrawColor(210, 205, 195);
        }
        doc.setLineWidth(0.3);
        doc.rect(bx, y, segW, 9, 'FD');
        doc.setFontSize(6);
        doc.setFont('helvetica', on ? 'bold' : 'normal');
        doc.setTextColor(...(on ? s.activeTxt : ([155, 145, 130] as RGB)));
        doc.text(s.label, bx + segW / 2, y + 6, { align: 'center' });
      });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(70, 60, 50);
      doc.text(`Score: ${score.score} / 7  —  ${score.label}`, M, y + 15);

      y += 21;

      // ── PERSONAL READING ─────────────────────────────────────────────
      const readingText = aiContent?.reading ?? dir.reason;
      const readingLines = doc.splitTextToSize(readingText, CW - 14);
      const readingH = Math.max(16, readingLines.length * 4.2 + 10);

      checkBreak(readingH + 14);
      sectionLabel(isAI ? 'AI-Personalised Reading' : 'Personal Reading');

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(M, y, CW, readingH, 2, 2, 'F');
      doc.setDrawColor(230, 220, 200);
      doc.setLineWidth(0.3);
      doc.roundedRect(M, y, CW, readingH, 2, 2, 'S');

      if (isAI) {
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(CW + M - 30, y + 2, 28, 5.5, 1.5, 1.5, 'F');
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(180, 83, 9);
        doc.text('AI PERSONALISED', CW + M - 16, y + 5.8, { align: 'center' });
      }

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 50, 40);
      doc.text(readingLines, M + 5, y + 7.5);

      y += readingH + 9;

      // ── YOUR ANSWERS ─────────────────────────────────────────────────
      checkBreak(55);
      sectionLabel('Your Answers');

      QUESTIONS.forEach((q) => {
        const a = ans[q.id];
        const impl = a ? q.yesImplication : q.noImplication;
        const label = a ? 'YES' : 'NO';
        const badgeColor: RGB = a ? [21, 128, 61] : [185, 28, 28];

        const qLines = doc.splitTextToSize(q.text, CW - 26);
        const iLines = doc.splitTextToSize(impl, CW - 26);
        const rowH = (qLines.length + iLines.length) * 3.8 + 9;

        checkBreak(rowH + 3);

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(M, y, CW, rowH, 1.5, 1.5, 'F');
        doc.setDrawColor(232, 225, 212);
        doc.setLineWidth(0.3);
        doc.roundedRect(M, y, CW, rowH, 1.5, 1.5, 'S');

        // YES/NO badge
        doc.setFillColor(...badgeColor);
        doc.roundedRect(M + 3, y + rowH / 2 - 3.8, 13, 7.5, 2, 2, 'F');
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(label, M + 9.5, y + rowH / 2 + 1.2, { align: 'center' });

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 45, 35);
        doc.text(qLines, M + 19, y + 6);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 88, 76);
        doc.text(iLines, M + 19, y + 6 + qLines.length * 3.8);

        y += rowH + 2;
      });

      y += 4;

      // ── TIPS ─────────────────────────────────────────────────────────
      checkBreak(50);
      sectionLabel(isAI ? 'AI-Personalised Tips — What To Do Next' : 'What To Do Next');

      tips.forEach((tip, i) => {
        const tipLines = doc.splitTextToSize(tip, CW - 22);
        const tipH = tipLines.length * 4 + 10;

        checkBreak(tipH + 3);

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(M, y, CW, tipH, 1.5, 1.5, 'F');
        doc.setDrawColor(232, 225, 212);
        doc.setLineWidth(0.3);
        doc.roundedRect(M, y, CW, tipH, 1.5, 1.5, 'S');

        doc.setFillColor(193, 127, 43);
        doc.circle(M + 7, y + tipH / 2, 5, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${i + 1}`, M + 7, y + tipH / 2 + 1.5, { align: 'center' });

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 40, 30);
        doc.text(tipLines, M + 16, y + 7.5);

        y += tipH + 2;
      });

      // ── FOOTER ───────────────────────────────────────────────────────
      // Push footer toward bottom of current page
      const footerY = Math.max(y + 12, H - 50);
      if (footerY + 50 > H) {
        newPage();
        y = H - 52;
      } else {
        y = footerY;
      }

      doc.setDrawColor(193, 127, 43);
      doc.setLineWidth(0.5);
      doc.line(M, y, W - M, y);
      y += 5;

      if (logoB64) {
        doc.addImage(logoB64, 'PNG', M, y, 17, 17);
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 40, 30);
      doc.text('Neeravna AI', M + 21, y + 8);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 88, 76);
      doc.text('by Neeraj — AI Product Manager from Structural Engineering', M + 21, y + 15);

      y += 22;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(193, 127, 43);
      doc.textWithLink('www.neeravnaai.in', M, y, { url: 'https://www.neeravnaai.in' });

      const w1 = doc.getTextWidth('www.neeravnaai.in');
      doc.setTextColor(180, 165, 140);
      doc.text('   |   ', M + w1, y);
      const sep = doc.getTextWidth('   |   ');

      doc.setTextColor(193, 127, 43);
      doc.textWithLink('@neeravna.ai on Instagram', M + w1 + sep, y, {
        url: 'https://www.instagram.com/neeravna.ai',
      });

      y += 8;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(165, 150, 130);
      doc.text('Generated by Vastu Check App — a product by Neeravna AI', M, y);

      doc.save(`vastu-report-${dir.shortCode}-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Could not generate PDF. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  }, [aiContent, tips, isAI, verdict]);

  const handleShare = useCallback(async () => {
    const text = [
      `Vastu Check Report`,
      `Gate Direction: ${directionData.name} (${directionData.shortCode})${heading ? ` — ${heading}°` : ''}`,
      `Status: ${verdict.text}`,
      `Score: ${scoreResult.label}`,
      ``,
      aiContent?.reading ?? directionData.reason,
      ``,
      `What to do next:`,
      ...tips.map((t, i) => `${i + 1}. ${t}`),
      ``,
      `Checked with Vastu Check — by Neeravna AI`,
      `neeravnaai.in  |  @neeravna.ai`,
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
        <div className="flex flex-col gap-3">
          <button
            onClick={generatePDF}
            disabled={pdfGenerating || aiLoading}
            className="w-full py-4 rounded-2xl text-white text-base font-semibold active:opacity-80 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#C17F2B', minHeight: '56px' }}
          >
            {pdfGenerating ? 'Generating PDF…' : 'Download Report PDF 📄'}
          </button>
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-2xl text-base font-semibold border-2 active:opacity-70 transition-opacity"
            style={{ minHeight: '56px', borderColor: '#C17F2B', color: '#C17F2B', backgroundColor: 'transparent' }}
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

        {/* Neeravna AI Branding Footer */}
        <div className="py-5 flex flex-col items-center gap-2 border-t border-gray-100 pb-8">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Neeravna AI"
              width={28}
              height={28}
              className="rounded object-contain"
            />
            <span className="text-sm font-semibold text-gray-600">Neeravna AI</span>
          </div>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            by Neeraj — AI Product Manager from Structural Engineering
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://www.neeravnaai.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold"
              style={{ color: '#C17F2B' }}
            >
              neeravnaai.in
            </a>
            <span className="text-gray-200">|</span>
            <a
              href="https://www.instagram.com/neeravna.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold"
              style={{ color: '#C17F2B' }}
            >
              @neeravna.ai
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
