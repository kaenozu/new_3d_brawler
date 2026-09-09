import { Vector3 } from "@babylonjs/core";

export type Aabb = {
  center: Vector3;
  half: Vector3;
};

export function overlaps(a: Aabb, b: Aabb): boolean {
  return (
    Math.abs(a.center.x - b.center.x) <= a.half.x + b.half.x &&
    Math.abs(a.center.y - b.center.y) <= a.half.y + b.half.y &&
    Math.abs(a.center.z - b.center.z) <= a.half.z + b.half.z
  );
}

/** Capsule(Hurt)をAABB近似する。posは足元。 */
export function capsuleAabb(
  pos: Vector3,
  radius: number,
  height: number,
): Aabb {
  return {
    center: new Vector3(pos.x, pos.y + height / 2, pos.z),
    half: new Vector3(radius, height / 2, radius),
  };
}

/** 攻撃Boxを生成。xは攻撃者の前方オフセット済み中心。 */
export function attackBox(
  center: Vector3,
  half: Vector3,
): Aabb {
  return { center, half };
}
