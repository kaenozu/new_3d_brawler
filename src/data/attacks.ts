import type { AttackDefinition } from "../combat/AttackDefinition";

export const ATTACKS = {
  attack1: {
    damage: 10,
    duration: 0.35,
    hitStart: 0.12,
    hitEnd: 0.2,
    knockback: 0.8,
    reaction: "light",
    hitStop: 0.055,
    cameraShake: 0.25,
  },
  attack2: {
    damage: 12,
    duration: 0.38,
    hitStart: 0.13,
    hitEnd: 0.22,
    knockback: 1.0,
    reaction: "light",
    hitStop: 0.055,
    cameraShake: 0.25,
  },
  attack3: {
    damage: 20,
    duration: 0.52,
    hitStart: 0.18,
    hitEnd: 0.28,
    knockback: 2.0,
    reaction: "knockback",
    hitStop: 0.09,
    cameraShake: 0.5,
  },
  strong: {
    damage: 30,
    duration: 0.7,
    hitStart: 0.25,
    hitEnd: 0.36,
    knockback: 3.0,
    reaction: "down",
    hitStop: 0.12,
    cameraShake: 0.8,
  },
} satisfies Record<string, AttackDefinition>;

export type AttackKey = keyof typeof ATTACKS;
