export type ReactionType =
  | "light"
  | "heavy"
  | "knockback"
  | "launch"
  | "down";

export type AttackDefinition = {
  damage: number;
  duration: number;
  /** 攻撃開始からの判定発生 [sec] */
  hitStart: number;
  /** 攻撃開始からの判定終了 [sec] */
  hitEnd: number;
  knockback: number;
  reaction: ReactionType;
  hitStop: number;
  /** 0=小 1=中 2=大 を想定した 0..1 の強さ */
  cameraShake: number;
};
