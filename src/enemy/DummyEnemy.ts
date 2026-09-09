import { Scene, TransformNode, Vector3 } from "@babylonjs/core";
import type { EnemyAIState } from "./EnemyAI";
import { capsuleAabb, type Aabb } from "../combat/Hitbox";
import { BLOB_HURTBOX, GOLEM_HURTBOX } from "../combat/Hurtbox";
import { EnemyModel, type EnemyKind } from "./EnemyModel";

export type { EnemyKind };

let nextId = 1;

const STATS: Record<
  EnemyKind,
  { maxHp: number; moveSpeed: number; attackRange: number; attackDamage: number }
> = {
  blob: { maxHp: 50, moveSpeed: 2.3, attackRange: 1.5, attackDamage: 8 },
  golem: { maxHp: 100, moveSpeed: 1.3, attackRange: 1.8, attackDamage: 12 },
};

export class DummyEnemy {
  public readonly id = nextId++;
  public readonly root: TransformNode;
  private readonly model: EnemyModel;
  public readonly kind: EnemyKind;

  public maxHp: number;
  public hp: number;
  public state: EnemyAIState = "Idle";
  private stateTime = 0;
  private cooldown = 0.5;
  private knockback = new Vector3(0, 0, 0);
  private flash = 0;

  /** 攻撃シリアルと命中記録 (プレイヤーへの多段防止) */
  public attackSerial = 0;
  private playerHitSerial = -1;

  public constructor(scene: Scene, x = 3, kind: EnemyKind = "blob") {
    this.kind = kind;
    const s = STATS[kind];
    this.maxHp = s.maxHp;
    this.hp = s.maxHp;

    this.root = new TransformNode(`dummyEnemyRoot-${this.id}`, scene);
    this.root.position = new Vector3(x, 0, 0);
    this.model = new EnemyModel(scene, this.root, kind);
  }

  public get moveSpeed(): number {
    return STATS[this.kind].moveSpeed;
  }

  public get attackRange(): number {
    return STATS[this.kind].attackRange;
  }

  public get attackDamage(): number {
    return STATS[this.kind].attackDamage;
  }

  public get isAlive(): boolean {
    return this.state !== "Dead";
  }

  public getHurtAabb(): Aabb {
    const h = this.kind === "blob" ? BLOB_HURTBOX : GOLEM_HURTBOX;
    return capsuleAabb(this.root.position, h.radius, h.height);
  }

  /** 敵攻撃の判定Box。攻撃モーションの hit window 内のみ返す */
  public getAttackAabb(playerPos: Vector3): Aabb | null {
    if (this.state !== "Attack") return null;
    // Attack 0.6s のうち 0.28〜0.42s が発生
    if (this.stateTime < 0.28 || this.stateTime > 0.42) return null;
    const dir = playerPos.x >= this.root.position.x ? 1 : -1;
    const center = new Vector3(
      this.root.position.x + dir * (this.kind === "golem" ? 1.1 : 0.9),
      this.kind === "golem" ? 1.0 : 0.6,
      0,
    );
    return {
      center,
      half:
        this.kind === "golem"
          ? new Vector3(1.0, 0.8, 1.0)
          : new Vector3(0.8, 0.6, 0.9),
    };
  }

  public canHitPlayer(serial: number): boolean {
    return this.playerHitSerial !== serial;
  }

  public markHitPlayer(serial: number): void {
    this.playerHitSerial = serial;
  }

  public takeDamage(damage: number, fromX: number, knockback: number, down: boolean): boolean {
    if (!this.isAlive) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.flash = 0.15;
    const dir = this.root.position.x >= fromX ? 1 : -1;
    this.knockback.set(dir * (2 + knockback), 0, 0);

    if (this.hp <= 0) {
      this.setState("Dead");
      return true;
    }
    if (down || damage >= 20) {
      this.setState("Down");
    } else {
      this.setState("Hit");
    }
    return true;
  }

  private setState(s: EnemyAIState): void {
    if (s === "Attack") {
      this.attackSerial += 1;
    }
    this.state = s;
    this.stateTime = 0;
    // Golemは人型なので横倒し、Blobは潰れポーズ(モデル側)のみ
    const m = this.model.outer;
    if ((s === "Down" || s === "Dead") && this.kind === "golem") {
      m.rotation.set(0, 0, Math.PI / 2);
      m.position.y = 0.45;
    } else {
      m.rotation.set(0, 0, 0);
      m.position.y = 0;
    }
  }

  public update(dt: number, playerPosition: Vector3): void {
    this.stateTime += dt;
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.flash > 0) {
      this.flash -= dt;
      this.model.flash(true);
      if (this.flash <= 0) this.model.flash(false);
    }

    // ノックバック減衰 (1ライン: Xのみ)
    this.root.position.x += this.knockback.x * dt;
    this.knockback.scaleInPlace(Math.max(0, 1 - dt * 6));
    if (this.knockback.length() < 0.05) this.knockback.set(0, 0, 0);

    // 1ライン: X距離のみでAI判断
    const dx = playerPosition.x - this.root.position.x;
    const dist = Math.abs(dx);
    const dir = dx >= 0 ? 1 : -1;
    this.model.setFacing(dir);

    switch (this.state) {
      case "Idle":
        if (this.stateTime > 0.4) this.setState("Approach");
        break;
      case "Approach": {
        if (dist > this.attackRange) {
          this.root.position.x += Math.sign(dx) * this.moveSpeed * dt;
        } else if (this.cooldown <= 0) {
          this.setState("Attack");
        }
        break;
      }
      case "Attack":
        // 突進っぽく少し前へ
        if (this.stateTime < 0.3) {
          this.root.position.x += dir * 1.2 * dt;
        }
        if (this.stateTime >= 0.6) {
          this.cooldown = 0.9 + Math.random() * 0.5;
          this.setState("Cooldown");
        }
        break;
      case "Cooldown":
        if (this.stateTime >= 0.5) this.setState("Approach");
        break;
      case "Hit":
        if (this.stateTime >= 0.32) this.setState("Approach");
        break;
      case "Down":
        if (this.stateTime >= 0.9) {
          this.cooldown = 0.6;
          this.setState("Approach");
        }
        break;
      case "Dead":
        // 沈む
        if (this.stateTime > 0.8) {
          this.root.position.y -= dt * 1.2;
        }
        break;
    }

    this.root.position.z = 0;
    this.model.animate(this.state, this.stateTime, dt);
  }

  public dispose(): void {
    this.model.dispose();
    this.root.dispose();
  }
}
