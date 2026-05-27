# Vastu Live Gate Checker — CLAUDE.md

## What This App Does
A mobile-first Progressive Web App (PWA). The user physically stands at the center of their home, points their phone toward the main entrance, and the app uses the phone's built-in compass to detect the gate direction in real time. It then gives a full Vastu Shastra compliance report — with compassionate, plain-language explanations — asking only the most impactful follow-up questions, all as simple taps.

Zero typing. Zero friction. Designed for homeowners and home buyers with no technical knowledge.

---

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (mobile-first, all sizing for 390px viewport)
- **PWA**: `next-pwa` package for offline capability and "Add to Home Screen"
- **Compass**: Browser DeviceOrientation API (no external library)
- **No backend. No database. No login. No typing required.**

---

## User Flow (Step by Step)

### Screen 1 — Welcome
- App name: "Vastu Check"
- One line: "Stand at the center of your home"
- Subtext: "We'll use your phone's compass to check your entrance direction"
- Single large button: "Start Check"
- Small note at bottom: "Works best indoors. Keep phone flat and level."

### Screen 2 — Permission Request (iOS only, Android auto-grants)
- Friendly message: "We need access to your compass to detect direction"
- Button: "Allow Compass Access"
- If denied: show manual direction selector (fallback — 8 compass direction buttons)

### Screen 3 — Live Compass (Main Interaction)
- Large circular compass UI showing live bearing in real time
- Current direction shown in large text: e.g., "Facing: Northeast (NE)"
- Instruction text (top): "Point this phone toward your main entrance"
- The compass needle moves in real time as user rotates
- One large button at bottom: "Lock Gate Direction →"
- Tapping this freezes the compass and saves the bearing

### Screen 4 — Quick Questions (Max 4, One Per Screen)
Each question is fullscreen. Simple, warm language. Two buttons only: ✅ Yes / ❌ No.

Questions (show all 4, one at a time):
1. "Is there a beam or heavy structure directly above your entrance door?" 
   - Hint: "Look up at the ceiling just above the door"
2. "Does your main door open inward — pushing into the home?" 
   - Hint: "Stand outside and push the door — does it open toward you or away?"
3. "Is the area just outside your entrance well-lit, even at night?"
   - Hint: "Think about street light, a porch light, or a lamp near the door"
4. "Is there a toilet or bathroom directly above or very close to the entrance?"
   - Hint: "Check the floor directly above the entrance door"

Show progress: "Question 2 of 4" — small dots at top, no numbers.

### Screen 5 — Results / Summary
Full Vastu report. Compassionate, plain language. No Vastu jargon without explanation.

Structure:
1. **Big verdict** at top — one of three:
   - ✅ "Your entrance is Vastu-friendly" (green)
   - ⚠️ "Some things to be aware of" (amber)  
   - ❌ "Your entrance has Vastu concerns" (red)

2. **Gate direction card** — direction detected, deity, element, plain-language meaning

3. **Quick answers review** — each of the 4 questions answered, with a short implication (1 sentence max, plain English)

4. **Overall score** — a simple 5-point Vastu health bar (not a percentage, just: Excellent / Good / Fair / Needs Attention / Serious Concerns)

5. **What to do next** — 2–3 plain-language tips (never say "consult a Vastu expert" as the first tip — give something actionable first)

6. **Share button** — generates a simple text summary the user can WhatsApp to family

---

## Vastu Logic — lib/vastu.ts

### Gate Direction Verdicts

| Direction | Bearing Range | Status | Plain English Meaning |
|-----------|--------------|--------|-----------------------|
| North | 337.5–360 or 0–22.5 | Auspicious | Wealth and opportunity flow in |
| Northeast | 22.5–67.5 | Best | Most sacred — divine energy enters here |
| East | 67.5–112.5 | Auspicious | Health and morning light — very positive |
| Southeast | 112.5–157.5 | Inauspicious | Fire energy — can cause tension and loss |
| South | 157.5–202.5 | Inauspicious | Associated with obstacles and difficulty |
| Southwest | 202.5–247.5 | Worst | Most serious concern — avoid if possible |
| West | 247.5–292.5 | Auspicious | Good for name, reputation, and business |
| Northwest | 292.5–337.5 | Neutral | Generally acceptable, minor instability |

### Follow-up Question Scoring

Each question adds or subtracts from the Vastu score:
- Beam above entrance (Yes) → -1 point
- Door opens inward (Yes) → +1 point
- Entrance well-lit (Yes) → +1 point
- Toilet above entrance (Yes) → -2 points

Gate direction base score:
- Auspicious → 3 points
- Neutral → 2 points
- Inauspicious → 1 point
- Worst (SW) → 0 points

Max score: 7. Score bands:
- 6–7 → Excellent
- 4–5 → Good
- 3 → Fair
- 2 → Needs Attention
- 0–1 → Serious Concerns

---

## Compass Implementation — hooks/useCompass.ts

```typescript
// Use DeviceOrientationEvent
// On iOS 13+: must call DeviceOrientationEvent.requestPermission() first
// webkitCompassHeading gives magnetic north heading on iOS
// On Android: use alpha from DeviceOrientationEvent (may need to convert)
// Smooth reading: use a rolling average of last 5 readings to prevent jitter
// Return: { heading: number, direction: string, shortCode: string, permissionState: 'unknown' | 'granted' | 'denied' }
```

Key implementation notes:
- iOS uses `webkitCompassHeading` (already corrected for magnetic north)
- Android uses `360 - alpha` from the event (alpha is counter-clockwise from south)
- Detect platform: `typeof DeviceOrientationEvent.requestPermission === 'function'` means iOS
- Always smooth the heading: rolling average of 5 readings to eliminate jitter
- Show a calibration notice if accuracy seems off (event.webkitCompassAccuracy > 20)

---

## Fallback — Manual Direction Selector
If compass permission is denied OR browser doesn't support DeviceOrientation:
- Show 8 large tap buttons in a 2x4 grid: N, NE, E, SE, S, SW, W, NW
- User taps their best estimate
- Same result flow as compass path
- Show message: "Compass not available — please select the closest direction manually"

---

## PWA Setup

### next.config.ts
Use `next-pwa` to wrap the config. Cache strategy: NetworkFirst for pages, CacheFirst for static assets.

### public/manifest.json
```json
{
  "name": "Vastu Check",
  "short_name": "Vastu Check",
  "description": "Check your home entrance direction with your phone compass",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#faf8f5",
  "theme_color": "#C17F2B",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Create simple placeholder PNG icons (a compass icon on warm background) — or use a tool like sharp to generate them programmatically.

---

## File Structure

```
/app
  /page.tsx                  ← Root — renders <VastuApp />
  /layout.tsx                ← PWA meta tags, viewport, manifest link
/components
  /VastuApp.tsx              ← Main state machine (controls which screen shows)
  /screens
    /WelcomeScreen.tsx
    /PermissionScreen.tsx
    /CompassScreen.tsx       ← Live compass UI
    /QuestionScreen.tsx      ← Reusable — receives question data, shows Yes/No
    /ResultScreen.tsx        ← Full summary
  /ui
    /CompassDial.tsx         ← SVG compass rose, accepts live heading prop
    /ScoreBar.tsx            ← 5-level visual score indicator
    /DirectionCard.tsx       ← Shows direction + deity + meaning
/hooks
  /useCompass.ts             ← DeviceOrientation logic
/lib
  /vastu.ts                  ← All data, scoring logic
  /questions.ts              ← Question definitions array
/public
  /manifest.json
  /icon-192.png
  /icon-512.png
tailwind.config.ts
next.config.ts               ← next-pwa wrapped
package.json
```

---

## Design Guidelines

### Mobile-First Rules
- All touch targets: minimum 56px height
- Font sizes: minimum 16px body, 28px+ for key verdicts
- Single thumb zone: all primary actions at bottom 30% of screen
- No horizontal scrolling
- Portrait-only (set in manifest + CSS)

### Visual Style
- Background: warm off-white `#faf8f5`
- Heading font: Cormorant Garamond (serif, elegant, architectural)
- Body font: Inter
- Primary accent: `#C17F2B` (saffron gold — Vastu/sacred feel)
- Auspicious: `#15803d` (green-700)
- Inauspicious: `#b91c1c` (red-700)
- Neutral: `#b45309` (amber-700)
- Cards: white with 1px border, 16px radius, soft shadow

### Tone of Voice
- Warm and calm — like a knowledgeable friend, not a textbook
- Never alarmist — even bad results should feel actionable, not scary
- Short sentences. Plain words. No Sanskrit terms without immediate plain-English translation.
- Example of good tone: "Your entrance faces Southwest — in Vastu, this direction can sometimes bring instability. Here's what you can do about it."
- Example of bad tone: "Nairutya corner detected. Inauspicious. Remedies required."

---

## Install & Run

```bash
npm install
npm run dev
```

To test compass on real phone:
```bash
npm run build
npm start
```
Then open `http://YOUR_LOCAL_IP:3000` on your phone (must be on same WiFi). 
Or deploy to Vercel for HTTPS (required for compass API on real devices).

## Important: Compass Requires HTTPS
DeviceOrientation API only works on:
- `localhost` (for dev)
- HTTPS domains (for production)

Deploy to Vercel (`vercel deploy`) to get HTTPS instantly. The app will not work on plain HTTP on a real phone.
