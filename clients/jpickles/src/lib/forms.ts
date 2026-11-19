// The two client forms, as data. Every question from James's Google Forms is here,
// in the same order, with the same options. Change wording here; the pages and the
// coach dashboard both read from this file.

export type Field = {
  id: string;
  label: string;
  help?: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "date" | "radio" | "checkbox" | "scale" | "chips";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  unit?: string; // shown after number inputs
  min?: number;
  max?: number;
  step?: number;
  scaleLabels?: [string, string];
  autocomplete?: string;
  inputmode?: string;
  half?: boolean; // sits side by side with the next half field on wider screens
  exclusive?: string; // checkbox option that clears the others (e.g. "None")
  multiple?: boolean; // chips: allow more than one
  nudge?: number; // number fields: amount the − / + buttons change it by
  start?: number; // number fields: value the − / + buttons start from when empty
};

export type Section = { id: string; title: string; intro?: string; fields: Field[] };

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ---------------- Onboarding & consultation ---------------- */
export const onboarding: Section[] = [
  {
    id: "you",
    title: "About you",
    intro: "Your answers shape your training and nutrition plan. The more detail, the better.",
    fields: [
      { id: "name", label: "Full name", type: "text", required: true, autocomplete: "name" },
      { id: "email", label: "Email", type: "email", required: true, autocomplete: "email", inputmode: "email" },
      { id: "phone", label: "Phone number", type: "tel", required: true, autocomplete: "tel", inputmode: "tel", half: true },
      { id: "age", label: "Age", type: "number", nudge: 1, start: 30, required: true, min: 14, max: 99, inputmode: "numeric", half: true },
      { id: "weight_kg", label: "Weight", type: "number", nudge: 0.1, start: 75, unit: "kg", step: 0.1, min: 30, max: 300, inputmode: "decimal", half: true },
      { id: "height_cm", label: "Height", type: "number", nudge: 1, start: 170, unit: "cm", min: 120, max: 230, inputmode: "numeric", half: true },
      { id: "plan", label: "Which coaching are you interested in?", type: "radio", required: true, help: "You can change this when we talk.", options: [] /* filled from site.ts on the page */ },
    ],
  },
  {
    id: "health",
    title: "Health",
    intro: "So I can keep your training safe.",
    fields: [
      { id: "conditions", label: "Do you have any of the following?", type: "checkbox", required: true, exclusive: "None", options: ["Heart condition", "High blood pressure", "Joint pain or injury", "Back pain", "Asthma", "Diabetes", "None"] },
      { id: "medical_notes", label: "Please explain any medical issues or injuries", type: "textarea" },
      { id: "medication", label: "Are you currently taking medication?", type: "radio", options: ["Yes", "No"] },
    ],
  },
  {
    id: "lifestyle",
    title: "Lifestyle and daily routine",
    fields: [
      { id: "typical_weekday", label: "What does a typical weekday look like for you?", help: "Work hours, commute, stress, meals, movement, sleep.", type: "textarea", required: true },
      { id: "job_activity", label: "How active is your job?", type: "radio", required: true, options: ["Mostly sitting", "Mixed", "Mostly active"] },
      { id: "daily_steps", label: "How many steps do you do on average a day?", type: "text", required: true, inputmode: "numeric", placeholder: "e.g. 7,000" },
    ],
  },
  {
    id: "training",
    title: "Training background",
    fields: [
      { id: "currently_train", label: "Do you currently train?", type: "radio", required: true, options: ["Yes", "No", "Not in the last 6 months"] },
      { id: "current_exercises", label: "If yes, what exercises do you do?", type: "text" },
      { id: "comfortable_with", label: "Which of these exercises are you comfortable with?", help: "Tick all that apply. None is fine too.", type: "checkbox", required: true, exclusive: "None of these yet", options: ["Dumbbell or barbell bench press", "Barbell squats", "Romanian deadlift", "Shoulder press", "Wall balls", "Barbell or dumbbell clean and press", "Burpees", "Lat pulldown machine", "None of these yet"] },
      { id: "preferred_training", label: "What type of training do you prefer?", type: "checkbox", options: ["Circuit training (HIIT)", "Weight training", "A mixture of both", "Gym classes"] },
      { id: "days_per_week", label: "How many days a week can you realistically train?", help: "Without strain on work and family life.", type: "chips", required: true, options: ["1", "2", "3", "4", "5", "6+"] },
      { id: "experience", label: "Training experience", type: "radio", required: true, options: ["Beginner", "Intermediate", "Advanced"] },
      { id: "knows_1rm", label: "Do you know how to use 1RM percentages?", help: "For example: back squat at 75% of your 1 rep max.", type: "radio", options: ["Yes", "No"] },
    ],
  },
  {
    id: "nutrition",
    title: "Nutrition and recovery",
    fields: [
      { id: "calories", label: "How many calories do you eat on an average day?", help: "A rough guess is fine, or \"No idea\".", type: "text", required: true },
      { id: "breakfast", label: "What would you eat for breakfast?", type: "textarea" },
      { id: "dinner", label: "What would you eat for dinner?", type: "textarea" },
      { id: "tea", label: "What would you eat for tea?", type: "textarea" },
      { id: "snacks", label: "What snacks would you have?", help: "Protein shakes, chocolate, crisps, nuts, fruit.", type: "textarea" },
      { id: "eating_consistency", label: "How consistent is your eating?", type: "radio", required: true, options: ["Inconsistent", "Consistent"] },
      { id: "water", label: "Water a day", type: "text", required: true, placeholder: "e.g. 2 litres", half: true },
      { id: "sleep_hours", label: "Average sleep", type: "number", nudge: 0.5, start: 7, unit: "hours", step: 0.5, min: 2, max: 14, inputmode: "decimal", half: true },
      { id: "rest_day", label: "Preferred rest day", type: "chips", options: days.map((d) => d.slice(0, 3)) },
      { id: "diet", label: "Dietary requirements", type: "radio", required: true, options: ["None", "Vegetarian", "Vegan", "Pescatarian", "Other"] },
      { id: "allergies", label: "Allergies, intolerances or special requirements", type: "textarea" },
      { id: "dislikes", label: "Foods you dislike, avoid or won't eat", help: "So your meal plan is food you'll actually enjoy.", type: "textarea" },
      { id: "mfp_username", label: "MyFitnessPal username", help: "Optional. If you log food there, share your diary so I can see it.", type: "text" },
    ],
  },
  {
    id: "goals",
    title: "Your goals",
    fields: [
      { id: "goal", label: "What are your goals?", type: "checkbox", required: true, options: ["Confidence", "Race or event performance", "Strength", "Muscle gain", "Fat loss", "Holiday prep", "Getting started in the gym", "A routine to follow"] },
      { id: "program_wants", label: "What do you want from this programme?", help: "Weights, running, bike, stair master, a race.", type: "textarea" },
      { id: "timeline", label: "Target timeline", help: "For example: 12 weeks, or a race date.", type: "text", required: true },
    ],
  },
  {
    id: "mindset",
    title: "Mindset and barriers",
    fields: [
      { id: "barriers", label: "What usually stops you staying consistent?", help: "Family, work, confidence, losing interest.", type: "textarea", required: true },
      { id: "past", label: "What has and hasn't worked for you before?", type: "textarea" },
    ],
  },
  {
    id: "availability",
    title: "Availability and support",
    fields: [
      { id: "best_days", label: "Best days to train", help: "Tick all that work.", type: "chips", multiple: true, required: true, options: days.map((d) => d.slice(0, 3)) },
      { id: "session_length", label: "How long is your usual gym session?", type: "chips", required: true, options: ["30 min", "45 min", "60 min", "75 min", "90 min+"] },
      { id: "training_time", label: "Preferred training time", type: "radio", options: ["Morning", "Afternoon", "Evening"] },
      { id: "coaching_style", label: "What coaching style suits you?", type: "radio", required: true, options: ["Strict", "Supportive", "Flexible", "Accountability"] },
      { id: "confirm", label: "I confirm my health information is accurate and I'll tell James if anything changes.", type: "checkbox", required: true, options: ["I confirm"] },
    ],
  },
];

/* ---------------- Weekly check-in ---------------- */
export const checkin: Section[] = [
  {
    id: "you",
    title: "This week",
    intro: "Answer for the past week. Honest answers get you a better plan.",
    fields: [
      { id: "name", label: "Full name", type: "text", required: true, autocomplete: "name" },
      { id: "email", label: "Email", type: "email", required: true, autocomplete: "email", inputmode: "email", help: "So your check-ins stay together." },
      { id: "checkin_date", label: "Check-in date", type: "date", required: true, half: true },
      { id: "weight_kg", label: "Current weight", type: "number", nudge: 0.1, start: 75, unit: "kg", step: 0.1, min: 30, max: 300, required: true, inputmode: "decimal", half: true, help: "First thing in the morning, after the toilet, before food or drink." },
    ],
  },
  {
    id: "training",
    title: "Training",
    fields: [
      { id: "workouts", label: "How many workouts did you complete?", help: "Sessions from your programme only.", type: "chips", options: ["0", "1", "2", "3", "4", "5+"] },
      { id: "physical", label: "How did you feel physically?", help: "Energy and readiness to train.", type: "scale", min: 1, max: 10, scaleLabels: ["Very poor", "Excellent"] },
      { id: "difficulty", label: "How challenging were your workouts?", type: "radio", options: ["Too easy", "Just right", "Too hard"] },
      { id: "pain", label: "Did anything aggravate an injury or cause pain?", help: "Where, which exercise, how bad. Or \"No\". Get medical advice for anything significant.", type: "textarea" },
      { id: "changes", label: "Anything you're bored of or want changed?", help: "Or \"No changes\".", type: "textarea" },
    ],
  },
  {
    id: "food",
    title: "Nutrition",
    fields: [
      { id: "nutrition", label: "How consistent were you with your nutrition?", help: "Against your agreed targets.", type: "radio", required: true, options: ["Excellent", "Good", "Average", "Poor"] },
      { id: "nutrition_factors", label: "What affected your nutrition?", help: "Tick all that apply.", type: "checkbox", exclusive: "Nothing, it went to plan", options: ["Nothing, it went to plan", "Hunger or cravings", "Eating out or social events", "Busy schedule or travel", "Meal prep or food availability", "Stress or emotional eating", "Weekend consistency", "Other"] },
      { id: "avg_calories", label: "Average daily calories", help: "Optional. From MyFitnessPal or your tracker.", type: "number", unit: "kcal", nudge: 50, start: 2000, min: 500, max: 8000, inputmode: "numeric", half: true },
      { id: "avg_protein", label: "Average daily protein", unit: "g", help: "Optional.", type: "number", nudge: 5, start: 120, min: 0, max: 500, inputmode: "numeric", half: true },
    ],
  },
  {
    id: "recovery",
    title: "Recovery",
    fields: [
      { id: "energy", label: "Average daily energy", type: "scale", min: 1, max: 10, scaleLabels: ["Very low", "Excellent"] },
      { id: "sleep", label: "Sleep quality", help: "How well you slept and how rested you felt.", type: "scale", min: 1, max: 10, scaleLabels: ["Very poor", "Excellent"] },
      { id: "steps", label: "Average daily steps", help: "From your phone or watch. Leave blank if you didn't track.", type: "number", nudge: 500, start: 8000, min: 0, max: 60000, inputmode: "numeric" },
    ],
  },
  {
    id: "next",
    title: "Next week",
    fields: [
      { id: "support", label: "What would help you most next week?", help: "Your biggest win, main challenge, upcoming events, anything to change.", type: "textarea" },
    ],
  },
];

// Short labels for the coach dashboard.
export const labelFor = (sections: Section[]) =>
  Object.fromEntries(sections.flatMap((s) => s.fields.map((f) => [f.id, f.label])));
