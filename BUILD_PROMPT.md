# BUILD PROMPT — Vastu Live Gate Checker (Mobile PWA)
# Paste this entire file into Claude Code after opening the project folder.

---

Build a complete mobile-first Next.js 14 TypeScript PWA called "Vastu Check". Read CLAUDE.md first — it has all the logic, screens, and data. Here is the exact build order.

---

## Step 1 — Scaffold

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
npm install next-pwa
```

---

## Step 2 — /lib/vastu.ts

Create the complete Vastu data file with:
- All 8 directions with bearing ranges (0–360), status, plain-English reason, deity, element
- `getDirectionFromHeading(heading: number): DirectionData` function
- `calculateScore(direction: DirectionData, answers: Record<string, boolean>): ScoreResult` function
- `ScoreResult` type: `{ score: number, band: 'excellent' | 'good' | 'fair' | 'needs-attention' | 'serious', label: string, color: string }`

Scoring rules from CLAUDE.md — direction base score + question modifiers.

---

## Step 3 — /lib/questions.ts

```typescript
export interface Question {
  id: string;
  text: string;
  hint: string;
  yesScore: number;   // points added if Yes
  noScore: number;    // points added if No
  yesImplication: string;   // shown on results screen
  noImplication: string;
}

export const QUESTIONS: Question[] = [
  {
    id: 'beam',
    text: 'Is there a beam or heavy structure directly above your entrance door?',
    hint: 'Look up at the ceiling just above the door',
    yesScore: -1,
    noScore: 0,
    yesImplication: 'A beam above the entrance can create oppressive energy. Consider a false ceiling or decorative cover.',
    noImplication: 'Good — no structural obstruction above the entrance.',
  },
  {
    id: 'opens_inward',
    text: 'Does your main door open inward — pushing into the home?',
    hint: 'Stand outside and push the door — does it open toward you or away from you?',
    yesScore: 1,
    noScore: 0,
    yesImplication: 'Doors opening inward welcome energy into the home. This is positive.',
    noImplication: 'Outward-opening doors can push energy away. If possible, consider reversing the hinge.',
  },
  {
    id: 'lighting',
    text: 'Is the area just outside your entrance well-lit, even at night?',
    hint: 'Think about a porch light, street lamp, or any light near the door',
    yesScore: 1,
    noScore: 0,
    yesImplication: 'Good lighting at the entrance attracts positive energy and opportunity.',
    noImplication: 'Adding a warm light near the entrance is one of the easiest Vastu improvements you can make.',
  },
  {
    id: 'toilet',
    text: 'Is there a toilet or bathroom directly above or very close to the entrance?',
    hint: 'Check the floor directly above the entrance door',
    yesScore: -2,
    noScore: 0,
    yesImplication: 'A toilet above or near the entrance is a significant Vastu concern. Remedies include salt bowls, crystals, or structural changes.',
    noImplication: 'No toilet near the entrance — this is good.',
  },
];
```

---

## Step 4 — /hooks/useCompass.ts

Implement the compass hook with these exact behaviors:

```typescript
export type PermissionState = 'unknown' | 'requesting' | 'granted' | 'denied' | 'unsupported';

export interface CompassState {
  heading: number | null;        // 0–360, magnetic north
  direction: string | null;      // e.g., "Northeast"
  shortCode: string | null;      // e.g., "NE"
  permissionState: PermissionState;
  requestPermission: () => Promise<void>;
  isSupported: boolean;
}
```

Implementation rules:
1. Detect iOS: `typeof (DeviceOrientationEvent as any).requestPermission === 'function'`
2. On iOS: call `DeviceOrientationEvent.requestPermission()` only when user taps button
3. On iOS: use `event.webkitCompassHeading` for heading
4. On Android: derive heading as `(360 - event.alpha) % 360`
5. Smooth heading using rolling average of last 5 readings
6. Map heading to direction using ranges from CLAUDE.md
7. If DeviceOrientationEvent not in window: set permissionState = 'unsupported'

---

## Step 5 — /components/ui/CompassDial.tsx

SVG compass dial, 280x280px, accepts `heading: number | null` prop.

- Outer ring with N, NE, E, SE, S, SW, W, NW labels at correct positions
- Cardinal directions (N, S, E, W) slightly larger and bolder
- A red needle pointing to current heading — the needle rotates as heading changes
- If heading is null: show gentle pulsing animation to indicate "waiting for compass"
- Center dot
- The ring should look like a real compass — minimal, clean, premium
- Use CSS transition on needle rotation: `transition: transform 0.3s ease-out`
- The heading number shown below the compass: e.g., "247°  SW" in large text

---

## Step 6 — All Screens

Create each screen as a full-viewport flex column with content centered:

### /components/screens/WelcomeScreen.tsx
- App name "Vastu Check" in heading font, large
- Compass icon (SVG or emoji 🧭) 
- One instruction line: "Stand at the center of your home"
- Subtext: "Point your phone toward the main entrance. We'll use your compass to check."
- Large primary button at bottom: "Begin Check →"
- Props: `onStart: () => void`

### /components/screens/PermissionScreen.tsx
- Friendly icon (phone + compass)
- Heading: "Allow compass access"
- Body: "To detect your gate direction, we need your phone's compass. Your location is never recorded."
- Primary button: "Allow Access"
- Secondary text link: "Enter direction manually instead"
- Props: `onRequestPermission: () => void`, `onManual: () => void`

### /components/screens/CompassScreen.tsx
- Small instruction at top: "Point toward your main entrance"
- CompassDial component (live, centered)
- Current direction in large text below dial
- Large primary button at bottom (56px min height): "Lock This Direction →"
- If heading is null: button is disabled, shows "Waiting for compass…"
- Props: `compassState: CompassState`, `onLock: (heading: number, shortCode: string) => void`

### /components/screens/ManualScreen.tsx (fallback)
- Heading: "Select your entrance direction"
- 8 large buttons in a 2x4 grid (or 4x2): N, NE, E, SE, S, SW, W, NW
- Each button: direction name + short code, 56px tall
- Tapping selects and moves to questions
- Props: `onSelect: (shortCode: string) => void`

### /components/screens/QuestionScreen.tsx (reusable)
- Progress dots at top (4 dots, current one filled)
- Question text centered, large (24px)
- Hint text below in muted smaller text
- Two large buttons at bottom (full width):
  - ✅ Yes (green tint)
  - ❌ No (neutral/gray)
- Props: `question: Question`, `questionIndex: number`, `totalQuestions: number`, `onAnswer: (id: string, answer: boolean) => void`

### /components/screens/ResultScreen.tsx
Full Vastu summary. Layout (top to bottom):
1. Score band header (full-width colored strip): label + icon
2. Gate direction card: direction name, bearing, deity, element, plain reason
3. "Your Answers" section: list of 4 questions with checkmark/cross and implication
4. Score bar: /components/ui/ScoreBar.tsx
5. "What to do next": 2–3 plain-language tips (from vastu.ts based on direction + score)
6. Share button: `navigator.share()` or copies text to clipboard as fallback
- Props: `directionData: DirectionData`, `answers: Record<string, boolean>`, `scoreResult: ScoreResult`

---

## Step 7 — /components/ui/ScoreBar.tsx

A simple 5-segment bar. Each segment is a colored pill. Active segments filled, inactive ones empty/outline.

Segments (left to right): Serious → Needs Attention → Fair → Good → Excellent

Color the filled segments based on the band — use red for serious/needs-attention, amber for fair, green for good/excellent.

Props: `band: ScoreResult['band']`

---

## Step 8 — /components/VastuApp.tsx

Main state machine. Controls which screen renders.

```typescript
type AppScreen = 'welcome' | 'permission' | 'compass' | 'manual' | 'question' | 'result';

interface AppState {
  screen: AppScreen;
  lockedHeading: number | null;
  lockedShortCode: string | null;
  currentQuestionIndex: number;
  answers: Record<string, boolean>;
}
```

Transitions:
- welcome → (if iOS or permission needed) → permission, else → compass
- permission → (allow) → compass | (manual) → manual
- compass → (lock) → question[0]
- manual → (select) → question[0]
- question[n] → question[n+1] → ... → result
- result → (retake) → welcome (reset state)

---

## Step 9 — /app/page.tsx

```tsx
import VastuApp from '@/components/VastuApp';

export default function Page() {
  return <VastuApp />;
}
```

---

## Step 10 — /app/layout.tsx

```tsx
import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

// viewport: width=device-width, initial-scale=1, maximum-scale=1 (prevent zoom on double-tap)
// background: #faf8f5
// Link to /manifest.json
// theme-color: #C17F2B
```

---

## Step 11 — /public/manifest.json

Create as shown in CLAUDE.md. For icons, create two simple SVG-based PNGs using a Node script or use a placeholder compass emoji rendered to canvas. If that's complex, just reference the icons in manifest and create empty placeholder files — the app will still work.

---

## Step 12 — next.config.ts

Wrap with next-pwa:
```typescript
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})({
  // your config
});

export default nextConfig;
```

---

## Step 13 — Global Styles (app/globals.css)

Add to Tailwind base:
```css
html, body {
  overscroll-behavior: none;
  overflow: hidden;
  height: 100%;
  background: #faf8f5;
}

#vastu-app {
  height: 100dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

Use `100dvh` (dynamic viewport height) to handle mobile browser chrome correctly.

---

## Final Checklist

- [ ] `npm run build` passes with zero TypeScript errors
- [ ] On iOS: compass permission prompt appears before CompassScreen
- [ ] On Android: compass works immediately
- [ ] Selecting SW/S/SE → red result, "Serious Concerns" or "Needs Attention"
- [ ] Selecting NE → green result, "Excellent"
- [ ] All 4 questions appear one at a time with progress dots
- [ ] Result screen shows full summary with score bar
- [ ] Share button works (navigator.share or clipboard fallback)
- [ ] App works portrait-only, no horizontal scroll
- [ ] Manual direction selector works when compass denied

---

## Test on Real Phone

```bash
npm run build && npm start
```

Find your local IP:
- Mac: `ipconfig getifaddr en0`
- Windows: `ipconfig` → look for IPv4

Open `http://YOUR_IP:3000` on phone (same WiFi).

Or deploy instantly:
```bash
npx vercel
```
HTTPS is required for the compass API to work on a real device.
