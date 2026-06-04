import type { HealthLog } from "@/redux/api/healthLogApi";

export interface HealthTemplateMeta {
  type: HealthLog["type"];
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
  accent: string;
  glow: string;
  ring: string;
  text: string;
}

export const HEALTH_TEMPLATES: Record<HealthLog["type"], HealthTemplateMeta> = {
  ROUTINE: {
    type: "ROUTINE",
    label: "Daily Routine",
    shortLabel: "Routine",
    emoji: "📋",
    description: "Log your wake/sleep time, meals, water intake & screen time",
    accent: "var(--template-routine)",
    glow: "var(--glow-routine)",
    ring: "var(--template-routine)",
    text: "var(--text-routine)",
  },
  GOAL: {
    type: "GOAL",
    label: "Today's Goal",
    shortLabel: "Goal",
    emoji: "🎯",
    description: "Create a checklist, set priorities, track completion",
    accent: "var(--template-goal)",
    glow: "var(--glow-goal)",
    ring: "var(--template-goal)",
    text: "var(--text-goal)",
  },
  WORKOUT: {
    type: "WORKOUT",
    label: "Fitness & Workout",
    shortLabel: "Workout",
    emoji: "💪",
    description: "Log activity type, duration, calories & exercises",
    accent: "var(--template-workout)",
    glow: "var(--glow-workout)",
    ring: "var(--template-workout)",
    text: "var(--text-workout)",
  },
  MOOD: {
    type: "MOOD",
    label: "Mind & Mood",
    shortLabel: "Mood",
    emoji: "🧠",
    description: "Track your mood, gratitude journal & stress level",
    accent: "var(--template-mood)",
    glow: "var(--glow-mood)",
    ring: "var(--template-mood)",
    text: "var(--text-mood)",
  },
  QUICK: {
    type: "QUICK",
    label: "Quick Log",
    shortLabel: "Quick",
    emoji: "⚡",
    description: "Water, sleep, weight, or period — log it fast",
    accent: "var(--template-quick)",
    glow: "var(--glow-quick)",
    ring: "var(--template-quick)",
    text: "var(--text-quick)",
  },
};

export const TEMPLATE_ORDER: HealthLog["type"][] = ["ROUTINE", "GOAL", "WORKOUT", "MOOD", "QUICK"];

export function getTemplate(type: HealthLog["type"]): HealthTemplateMeta {
  return HEALTH_TEMPLATES[type] || HEALTH_TEMPLATES.QUICK;
}
