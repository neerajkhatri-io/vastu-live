export interface Question {
  id: string;
  text: string;
  hint: string;
  yesScore: number;
  noScore: number;
  yesImplication: string;
  noImplication: string;
}

export const QUESTIONS: Question[] = [
  {
    id: 'beam',
    text: 'Is there a beam or heavy structure directly above your entrance door?',
    hint: 'Look up at the ceiling just above the door',
    yesScore: -1,
    noScore: 0,
    yesImplication:
      'A beam above the entrance can create oppressive energy. Consider a false ceiling or decorative cover.',
    noImplication: 'Good — no structural obstruction above the entrance.',
  },
  {
    id: 'opens_inward',
    text: 'Does your main door open inward — pushing into the home?',
    hint: 'Stand outside and push the door — does it open toward you or away from you?',
    yesScore: 1,
    noScore: 0,
    yesImplication: 'Doors opening inward welcome energy into the home. This is positive.',
    noImplication:
      'Outward-opening doors can push energy away. If possible, consider reversing the hinge.',
  },
  {
    id: 'lighting',
    text: 'Is the area just outside your entrance well-lit, even at night?',
    hint: 'Think about a porch light, street lamp, or any light near the door',
    yesScore: 1,
    noScore: 0,
    yesImplication: 'Good lighting at the entrance attracts positive energy and opportunity.',
    noImplication:
      'Adding a warm light near the entrance is one of the easiest Vastu improvements you can make.',
  },
  {
    id: 'toilet',
    text: 'Is there a toilet or bathroom directly above or very close to the entrance?',
    hint: 'Check the floor directly above the entrance door',
    yesScore: -2,
    noScore: 0,
    yesImplication:
      'A toilet above or near the entrance is a significant Vastu concern. Remedies include salt bowls, crystals, or structural changes.',
    noImplication: 'No toilet near the entrance — this is good.',
  },
];
