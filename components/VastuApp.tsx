'use client';

import { useCallback, useRef, useState } from 'react';
import { useCompass } from '@/hooks/useCompass';
import { calculateScore, getDirectionFromHeading, getDirectionFromShortCode } from '@/lib/vastu';
import { QUESTIONS } from '@/lib/questions';

import WelcomeScreen from '@/components/screens/WelcomeScreen';
import PermissionScreen from '@/components/screens/PermissionScreen';
import CompassScreen from '@/components/screens/CompassScreen';
import ManualScreen from '@/components/screens/ManualScreen';
import QuestionScreen from '@/components/screens/QuestionScreen';
import ResultScreen from '@/components/screens/ResultScreen';

type AppScreen = 'welcome' | 'permission' | 'compass' | 'manual' | 'question' | 'result';

interface AppState {
  screen: AppScreen;
  lockedHeading: number | null;
  lockedShortCode: string | null;
  currentQuestionIndex: number;
  answers: Record<string, boolean>;
}

const INITIAL_STATE: AppState = {
  screen: 'welcome',
  lockedHeading: null,
  lockedShortCode: null,
  currentQuestionIndex: 0,
  answers: {},
};

function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function';
  } catch {
    return false;
  }
}

export default function VastuApp() {
  const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
  const compassState = useCompass();
  // Keep a ref so handleStart always reads the latest isSupported without stale closures
  const compassRef = useRef(compassState);
  compassRef.current = compassState;

  const handleStart = useCallback(() => {
    const { isSupported } = compassRef.current;
    if (!isSupported) {
      setAppState((s) => ({ ...s, screen: 'manual' }));
    } else if (isIOSDevice()) {
      setAppState((s) => ({ ...s, screen: 'permission' }));
    } else {
      setAppState((s) => ({ ...s, screen: 'compass' }));
    }
  }, []);

  const handleRequestPermission = useCallback(async () => {
    await compassState.requestPermission();
    setAppState((s) => ({ ...s, screen: 'compass' }));
  }, [compassState]);

  const handleManual = useCallback(() => {
    setAppState((s) => ({ ...s, screen: 'manual' }));
  }, []);

  const handleLock = useCallback((heading: number, shortCode: string) => {
    setAppState((s) => ({
      ...s,
      lockedHeading: heading,
      lockedShortCode: shortCode,
      currentQuestionIndex: 0,
      answers: {},
      screen: 'question',
    }));
  }, []);

  const handleManualSelect = useCallback((shortCode: string) => {
    setAppState((s) => ({
      ...s,
      lockedShortCode: shortCode,
      lockedHeading: null,
      currentQuestionIndex: 0,
      answers: {},
      screen: 'question',
    }));
  }, []);

  const handleAnswer = useCallback((id: string, answer: boolean) => {
    setAppState((s) => {
      const newAnswers = { ...s.answers, [id]: answer };
      const nextIndex = s.currentQuestionIndex + 1;
      const isLastQuestion = nextIndex >= QUESTIONS.length;
      return {
        ...s,
        answers: newAnswers,
        currentQuestionIndex: isLastQuestion ? s.currentQuestionIndex : nextIndex,
        screen: isLastQuestion ? 'result' : 'question',
      };
    });
  }, []);

  const handleRetake = useCallback(() => {
    setAppState(INITIAL_STATE);
  }, []);

  const { screen, lockedHeading, lockedShortCode, currentQuestionIndex, answers } = appState;

  const directionData = lockedShortCode
    ? lockedHeading !== null
      ? getDirectionFromHeading(lockedHeading)
      : getDirectionFromShortCode(lockedShortCode)
    : null;

  const scoreResult =
    directionData && Object.keys(answers).length === QUESTIONS.length
      ? calculateScore(directionData, answers)
      : null;

  return (
    <div id="vastu-app" className="relative w-full" style={{ backgroundColor: '#faf8f5' }}>
      {screen === 'welcome' && <WelcomeScreen onStart={handleStart} />}

      {screen === 'permission' && (
        <PermissionScreen
          onRequestPermission={handleRequestPermission}
          onManual={handleManual}
        />
      )}

      {screen === 'compass' && (
        <CompassScreen compassState={compassState} onLock={handleLock} />
      )}

      {screen === 'manual' && <ManualScreen onSelect={handleManualSelect} />}

      {screen === 'question' && (
        <QuestionScreen
          question={QUESTIONS[currentQuestionIndex]}
          questionIndex={currentQuestionIndex}
          totalQuestions={QUESTIONS.length}
          onAnswer={handleAnswer}
        />
      )}

      {screen === 'result' && directionData && scoreResult && (
        <ResultScreen
          directionData={directionData}
          heading={lockedHeading}
          answers={answers}
          scoreResult={scoreResult}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
