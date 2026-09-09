import { overlaps, type Aabb } from "./Hitbox";

/**
 * 判定の薄いラッパー。HitStopやノックバックの適用はGame側。
 * 1攻撃1hitの記録は攻撃者側(Player/DummyEnemy)が持つ。
 */
export class CombatSystem {
  public testAttack(a: Aabb, victim: Aabb): boolean {
    return overlaps(a, victim);
  }
}
