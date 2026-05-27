'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getDirectionFromHeading } from '@/lib/vastu';

export type PermissionState = 'unknown' | 'requesting' | 'granted' | 'denied' | 'unsupported';

export interface CompassState {
  heading: number | null;
  direction: string | null;
  shortCode: string | null;
  permissionState: PermissionState;
  requestPermission: () => Promise<void>;
  isSupported: boolean;
}

function isIOS(): boolean {
  return typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === 'function';
}

export function useCompass(): CompassState {
  const [heading, setHeading] = useState<number | null>(null);
  const [direction, setDirection] = useState<string | null>(null);
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  // Start false so SSR and client initial render agree — set to real value on mount
  const [isSupported, setIsSupported] = useState(false);
  const readingsRef = useRef<number[]>([]);
  const listenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  const processHeading = useCallback((raw: number) => {
    const readings = readingsRef.current;
    readings.push(raw);
    if (readings.length > 5) readings.shift();

    let sinSum = 0;
    let cosSum = 0;
    for (const r of readings) {
      const rad = (r * Math.PI) / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
    }
    const avg = (Math.atan2(sinSum / readings.length, cosSum / readings.length) * 180) / Math.PI;
    const smoothed = ((avg % 360) + 360) % 360;

    const dirData = getDirectionFromHeading(smoothed);
    setHeading(Math.round(smoothed));
    setDirection(dirData.name);
    setShortCode(dirData.shortCode);
  }, []);

  const attachListener = useCallback(() => {
    if (listenerRef.current) return;

    const handler = (e: DeviceOrientationEvent) => {
      let raw: number | null = null;

      if (isIOS()) {
        raw = (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading ?? null;
      } else {
        if (e.alpha !== null) {
          raw = (360 - e.alpha) % 360;
        }
      }

      if (raw !== null) processHeading(raw);
    };

    listenerRef.current = handler;
    window.addEventListener('deviceorientation', handler, true);
    setPermissionState('granted');
  }, [processHeading]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setPermissionState('unsupported');
      return;
    }

    if (isIOS()) {
      setPermissionState('requesting');
      try {
        const result = await (
          DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }
        ).requestPermission();
        if (result === 'granted') {
          attachListener();
        } else {
          setPermissionState('denied');
        }
      } catch {
        setPermissionState('denied');
      }
    } else {
      attachListener();
    }
  }, [isSupported, attachListener]);

  useEffect(() => {
    // Detect support client-side only — keeps SSR/client renders in sync
    const supported = 'DeviceOrientationEvent' in window;
    setIsSupported(supported);

    if (!supported) {
      setPermissionState('unsupported');
      return;
    }

    // Android/non-iOS: auto-attach without permission prompt
    if (!isIOS()) {
      attachListener();
    }

    return () => {
      if (listenerRef.current) {
        window.removeEventListener('deviceorientation', listenerRef.current, true);
        listenerRef.current = null;
      }
    };
  }, [attachListener]);

  return {
    heading,
    direction,
    shortCode,
    permissionState,
    requestPermission,
    isSupported,
  };
}
