/** Reasons offered in the "Why?" step for past-tense items (kept zod-free so the app bundle stays small). */
export const WHY_IDS = [
  'time-marker-open', // perfecto: still-open period (hoy, este año) or experience (alguna vez, ya, todavía no)
  'time-marker-closed', // indefinido: closed period (ayer, en 2019, hace dos años)
  'completed-action', // indefinido: a finished event that moves the story forward
  'background-description', // imperfecto: description, circumstances, scene-setting
  'habit', // imperfecto: repeated/habitual action in the past
  'interrupted-action', // imperfecto: action in progress when something else happened
  'prior-past' // pluscuamperfecto: happened before another past event
] as const;
