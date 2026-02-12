/**
 * Pre-built Poll Templates for GreenLine365 Directory
 * 
 * 7 industry-specific templates + auto-assignment logic.
 * Each poll ends with an optional free-text comment field.
 * Part of the Custom Poll Template add-on ($150/template for custom ones).
 */

export interface PollQuestion {
  id: string;
  text: string;
  type: 'rating' | 'choice' | 'text';
  options?: string[];
  required?: boolean;
}

export interface PollTemplate {
  id: string;
  name: string;
  description: string;
  industries: string[];
  questions: PollQuestion[];
}

export const POLL_TEMPLATES: PollTemplate[] = [
  {
    id: 'restaurant-experience',
    name: 'Restaurant Experience',
    description: 'Customer feedback for dining establishments — food quality, service, and recommendations.',
    industries: ['dining'],
    questions: [
      { id: 'food_quality', text: 'How would you rate the food quality?', type: 'rating', required: true },
      { id: 'service_speed', text: 'How was the service speed?', type: 'choice', options: ['Fast', 'Reasonable', 'Slow'], required: true },
      { id: 'would_recommend', text: 'Would you recommend this restaurant?', type: 'choice', options: ['Yes', 'No'], required: true },
      { id: 'favorite_thing', text: "What's your favorite thing about this place?", type: 'text', required: false },
      { id: 'comment', text: 'Anything else you\'d like to share?', type: 'text', required: false },
    ],
  },
  {
    id: 'service-quality',
    name: 'Service Quality',
    description: 'Feedback for home service providers — work quality, punctuality, and pricing transparency.',
    industries: ['services'],
    questions: [
      { id: 'work_quality', text: 'How would you rate the work quality?', type: 'rating', required: true },
      { id: 'on_time', text: 'Was the technician on time?', type: 'choice', options: ['Early', 'On Time', 'Late'], required: true },
      { id: 'pricing_fair', text: 'Was the pricing fair and transparent?', type: 'choice', options: ['Yes', 'Somewhat', 'No'], required: true },
      { id: 'hire_again', text: 'Would you hire them again?', type: 'choice', options: ['Yes', 'No'], required: true },
      { id: 'comment', text: 'Anything else you\'d like to share?', type: 'text', required: false },
    ],
  },
  {
    id: 'vibe-check',
    name: 'Vibe Check',
    description: 'Atmosphere and experience feedback for nightlife venues — vibe, crowd, and return intent.',
    industries: ['nightlife'],
    questions: [
      { id: 'atmosphere', text: 'How would you rate the atmosphere?', type: 'rating', required: true },
      { id: 'crowd', text: 'How was the crowd?', type: 'choice', options: ['Chill', 'Energetic', 'Packed'], required: true },
      { id: 'come_back', text: 'Would you come back this weekend?', type: 'choice', options: ['Yes', 'Maybe', 'No'], required: true },
      { id: 'best_thing', text: 'Best thing about this spot?', type: 'text', required: false },
      { id: 'comment', text: 'Anything else you\'d like to share?', type: 'text', required: false },
    ],
  },
  {
    id: 'wellness-experience',
    name: 'Wellness Experience',
    description: 'Facility and staff feedback for health and wellness businesses — cleanliness, professionalism, booking ease.',
    industries: ['health-wellness'],
    questions: [
      { id: 'cleanliness', text: 'How would you rate the facility cleanliness?', type: 'rating', required: true },
      { id: 'professionalism', text: 'How was the staff professionalism?', type: 'rating', required: true },
      { id: 'booking_ease', text: 'How easy was booking an appointment?', type: 'choice', options: ['Very Easy', 'Easy', 'Difficult'], required: true },
      { id: 'would_recommend', text: 'Would you recommend to a friend?', type: 'choice', options: ['Yes', 'No'], required: true },
      { id: 'comment', text: 'Anything else you\'d like to share?', type: 'text', required: false },
    ],
  },
  {
    id: 'stay-hospitality',
    name: 'Stay & Hospitality',
    description: 'Guest experience feedback for hotels, resorts, and lodging — room quality, check-in, location.',
    industries: ['hotels-lodging'],
    questions: [
      { id: 'room_rating', text: 'How would you rate your room?', type: 'rating', required: true },
      { id: 'checkin', text: 'How was the check-in experience?', type: 'choice', options: ['Seamless', 'Average', 'Frustrating'], required: true },
      { id: 'location', text: 'How was the location for your trip?', type: 'choice', options: ['Perfect', 'Good', 'Inconvenient'], required: true },
      { id: 'stay_again', text: 'Would you stay here again?', type: 'choice', options: ['Yes', 'No'], required: true },
      { id: 'comment', text: 'Anything else you\'d like to share?', type: 'text', required: false },
    ],
  },
  {
    id: 'general-business',
    name: 'General Business',
    description: 'Universal feedback template that works for any business type — overall experience, service, and return intent.',
    industries: ['professional-services', 'style-shopping', 'family-entertainment', 'destinations'],
    questions: [
      { id: 'overall', text: 'How would you rate your overall experience?', type: 'rating', required: true },
      { id: 'customer_service', text: 'How was the customer service?', type: 'choice', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
      { id: 'easy_to_find', text: 'Was it easy to find what you needed?', type: 'choice', options: ['Yes', 'Somewhat', 'No'], required: true },
      { id: 'use_again', text: 'Would you use this business again?', type: 'choice', options: ['Yes', 'No'], required: true },
      { id: 'comment', text: 'Anything else you\'d like to share?', type: 'text', required: false },
    ],
  },
  {
    id: 'cleanliness-facility',
    name: 'Cleanliness & Facility',
    description: 'Restroom and facility cleanliness feedback — great for restaurants, bars, gyms, gas stations, and any public-facing business.',
    industries: ['dining', 'nightlife', 'health-wellness', 'hotels-lodging', 'family-entertainment', 'services', 'style-shopping', 'professional-services', 'destinations'],
    questions: [
      { id: 'restroom', text: 'How would you rate the restroom cleanliness?', type: 'rating', required: true },
      { id: 'facility', text: 'How was the overall facility maintenance?', type: 'choice', options: ['Spotless', 'Clean', 'Needs Attention', 'Poor'], required: true },
      { id: 'supplies', text: 'Were supplies stocked? (soap, paper towels, etc.)', type: 'choice', options: ['Yes', 'No'], required: true },
      { id: 'affect_return', text: 'Would the cleanliness affect your decision to return?', type: 'choice', options: ['Yes', 'No'], required: true },
      { id: 'comment', text: 'Anything else you\'d like to share?', type: 'text', required: false },
    ],
  },
];

/**
 * Get recommended poll templates for a given industry.
 * Returns the industry-specific template + the general + cleanliness templates.
 */
export function getTemplatesForIndustry(industry: string): PollTemplate[] {
  const specific = POLL_TEMPLATES.filter(t => t.industries.includes(industry) && t.id !== 'general-business' && t.id !== 'cleanliness-facility');
  const general = POLL_TEMPLATES.find(t => t.id === 'general-business')!;
  const cleanliness = POLL_TEMPLATES.find(t => t.id === 'cleanliness-facility')!;

  return [...specific, general, cleanliness];
}

/**
 * Get a single template by ID.
 */
export function getTemplateById(id: string): PollTemplate | undefined {
  return POLL_TEMPLATES.find(t => t.id === id);
}
