export type DirectionStatus = 'best' | 'auspicious' | 'neutral' | 'inauspicious' | 'worst';

export interface DirectionData {
  name: string;
  shortCode: string;
  bearingMin: number;
  bearingMax: number;
  bearingWraps?: boolean; // true for North which spans 337.5–360 and 0–22.5
  status: DirectionStatus;
  baseScore: number;
  reason: string;
  deity: string;
  element: string;
}

export type ScoreBand = 'excellent' | 'good' | 'fair' | 'needs-attention' | 'serious';

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  label: string;
  color: string;
}

export const DIRECTIONS: DirectionData[] = [
  {
    name: 'North',
    shortCode: 'N',
    bearingMin: 337.5,
    bearingMax: 22.5,
    bearingWraps: true,
    status: 'auspicious',
    baseScore: 3,
    reason: 'Wealth and opportunity flow in through the northern entrance.',
    deity: 'Kuber',
    element: 'Water',
  },
  {
    name: 'Northeast',
    shortCode: 'NE',
    bearingMin: 22.5,
    bearingMax: 67.5,
    status: 'best',
    baseScore: 3,
    reason: 'The most sacred direction — divine energy and blessings enter here.',
    deity: 'Ishanya',
    element: 'Space',
  },
  {
    name: 'East',
    shortCode: 'E',
    bearingMin: 67.5,
    bearingMax: 112.5,
    status: 'auspicious',
    baseScore: 3,
    reason: 'Morning sunlight and positive health energy enter through the east.',
    deity: 'Indra',
    element: 'Air',
  },
  {
    name: 'Southeast',
    shortCode: 'SE',
    bearingMin: 112.5,
    bearingMax: 157.5,
    status: 'inauspicious',
    baseScore: 1,
    reason: 'Fire energy at this entrance can bring tension and financial loss.',
    deity: 'Agni',
    element: 'Fire',
  },
  {
    name: 'South',
    shortCode: 'S',
    bearingMin: 157.5,
    bearingMax: 202.5,
    status: 'inauspicious',
    baseScore: 1,
    reason: 'The southern entrance is associated with obstacles and difficulty.',
    deity: 'Yama',
    element: 'Earth',
  },
  {
    name: 'Southwest',
    shortCode: 'SW',
    bearingMin: 202.5,
    bearingMax: 247.5,
    status: 'worst',
    baseScore: 0,
    reason: 'The most serious concern in Vastu — instability and loss can follow.',
    deity: 'Nirrti',
    element: 'Earth',
  },
  {
    name: 'West',
    shortCode: 'W',
    bearingMin: 247.5,
    bearingMax: 292.5,
    status: 'auspicious',
    baseScore: 3,
    reason: 'Good for name, reputation, and business success.',
    deity: 'Varuna',
    element: 'Water',
  },
  {
    name: 'Northwest',
    shortCode: 'NW',
    bearingMin: 292.5,
    bearingMax: 337.5,
    status: 'neutral',
    baseScore: 2,
    reason: 'Generally acceptable — may bring minor instability over time.',
    deity: 'Vayu',
    element: 'Air',
  },
];

export function getDirectionFromHeading(heading: number): DirectionData {
  const h = ((heading % 360) + 360) % 360;
  for (const dir of DIRECTIONS) {
    if (dir.bearingWraps) {
      if (h >= dir.bearingMin || h < dir.bearingMax) return dir;
    } else {
      if (h >= dir.bearingMin && h < dir.bearingMax) return dir;
    }
  }
  return DIRECTIONS[0];
}

export function getDirectionFromShortCode(shortCode: string): DirectionData {
  return DIRECTIONS.find((d) => d.shortCode === shortCode) ?? DIRECTIONS[0];
}

export function calculateScore(
  direction: DirectionData,
  answers: Record<string, boolean>
): ScoreResult {
  let score = direction.baseScore;
  if (answers['beam'] === true) score -= 1;
  if (answers['opens_inward'] === true) score += 1;
  if (answers['lighting'] === true) score += 1;
  if (answers['toilet'] === true) score -= 2;

  score = Math.max(0, Math.min(7, score));

  let band: ScoreBand;
  let label: string;
  let color: string;

  if (score >= 6) {
    band = 'excellent';
    label = 'Excellent';
    color = '#15803d';
  } else if (score >= 4) {
    band = 'good';
    label = 'Good';
    color = '#15803d';
  } else if (score === 3) {
    band = 'fair';
    label = 'Fair';
    color = '#b45309';
  } else if (score === 2) {
    band = 'needs-attention';
    label = 'Needs Attention';
    color = '#b91c1c';
  } else {
    band = 'serious';
    label = 'Serious Concerns';
    color = '#b91c1c';
  }

  return { score, band, label, color };
}

export function getTips(direction: DirectionData, result: ScoreResult): string[] {
  const tips: string[] = [];

  if (direction.status === 'worst') {
    tips.push(
      'Place a red doormat or door with red/copper accents at the entrance to counter southwest energy.'
    );
    tips.push('Keep the entrance well-lit at all times — a bright entrance reduces the effect of an inauspicious direction.');
  } else if (direction.status === 'inauspicious') {
    tips.push(
      'Add a small bowl of sea salt near the entrance and replace it weekly — this absorbs negative energy.'
    );
    tips.push('Place a green plant or fresh flowers near the entrance to introduce positive, living energy.');
  } else if (direction.status === 'neutral') {
    tips.push('Keep the entrance clutter-free and welcoming — clear pathways allow energy to flow smoothly.');
  } else {
    tips.push('Your entrance direction is working in your favor — keep it clean, bright, and welcoming.');
  }

  if (result.score <= 3) {
    tips.push(
      'A wind chime or melodious bell hung at the entrance can help lift the energy of the space.'
    );
  }

  if (tips.length < 2) {
    tips.push('Ensure the entrance is well-lit and that the door opens smoothly — these are the simplest and most effective Vastu improvements.');
  }

  return tips.slice(0, 3);
}
