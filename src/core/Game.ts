import {
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from "@babylonjs/core";
import { Input } from "./Input";
import { Player } from "../player/Player";
import { GameCamera } from "../camera/GameCamera";
import { DummyEnemy } from "../enemy/DummyEnemy";
import { Stage } from "../stage/Stage";
import { Encounter } from "../stage/Encounter";
import { CombatSystem } from "../combat/CombatSystem";
import { HitEffect } from "../effects/HitEffect";
import { SlashTrail } from "../effects/SlashTrail";
import { Hud } from "../ui/Hud";

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly input: Input;
  private readonly player: Player;
  private enemies: DummyEnemy[] = [];
  private readonly gameCamera: GameCamera;
  private readonly combat = new CombatSystem();
  private readonly hitEffect: HitEffect;
  private readonly slash: SlashTrail;
  private readonly hud = new Hud();
  private readonly encounter = new Encounter();

  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private hitStopTimer = 0;
  private paused = false;
  private defeatTimer = 0;
  private defeatShown = false;
  private clearShown = false;
  private lastSlashSerial = -1;

  public constructor(private readonly canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.54, 0.72, 0.88, 1);

    this.input = new Input();
    this.createLights();
    new Stage(this.scene).create();

    this.player = new Player(this.scene, this.input);
    this.hitEffect = new HitEffect(this.scene);
    this.slash = new SlashTrail(this.scene);
    this.gameCamera = new GameCamera(this.scene, this.player.root);
    this.encounter.start();

    this.hud.setHp(this.player.hp, this.player.maxHp);
    this.hud.setCombo(0);
    this.hud.setScore(0);

    window.addEventListener("resize", () => this.engine.resize());
  }

  public start(): void {
    let previous = performance.now();

    this.engine.runRenderLoop(() => {
      const now = performance.now();
      const realDt = Math.min((now - previous) / 1000, 0.05);
      previous = now;

      // ポーズ切替 (立ち上がり、長めバッファ)
      if (this.input.wasPressed("Escape", 0.3)) {
        this.input.consume("Escape");
        if (!this.player.isDead && !this.clearShown) {
          this.paused = !this.paused;
          if (this.paused) this.hud.showCenter("PAUSED", "Esc で再開 / R でリトライ");
          else this.hud.hideCenter();
        }
      }
      // リトライ
      if (this.input.wasPressed("KeyR", 0.3) || this.input.wasPressed("Enter", 0.3)) {
        this.input.consume("KeyR");
        this.input.consume("Enter");
        if (this.paused || this.defeatShown || this.clearShown || this.player.isDead) {
          this.retry();
          this.paused = false;
        }
      }

      if (!this.paused) {
        // ヒットストップ中は gameDt を潰す
        let gameDt = realDt;
        if (this.hitStopTimer > 0) {
          this.hitStopTimer -= realDt;
          gameDt = realDt * 0.05;
        }
        this.update(gameDt, realDt);
      }

      this.scene.render();
    });
  }

  private retry(): void {
    for (const e of this.enemies) e.dispose();
    this.enemies = [];
    this.player.reset();
    this.encounter.reset();
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.hitStopTimer = 0;
    this.defeatTimer = 0;
    this.defeatShown = false;
    this.clearShown = false;
    this.lastSlashSerial = -1;
    this.hud.setHp(this.player.hp, this.player.maxHp);
    this.hud.setCombo(0);
    this.hud.setScore(0);
    this.hud.hideCenter();
  }

  private update(dt: number, realDt: number): void {
    // 敗北後は敵・プレイヤー更新を止め、暗転待ちのみ進める
    if (this.player.isDead) {
      this.defeatTimer += realDt;
      this.hitEffect.update(dt);
      this.slash.update(dt);
      if (this.defeatTimer > 1.5 && !this.defeatShown) {
        this.defeatShown = true;
        this.hud.showCenter("RETRY", "R / Enter で再開");
      }
      return;
    }

    // スポーン
    const alive = this.enemies.filter((e) => e.isAlive).length;
    const spawns = this.encounter.update(dt, alive);
    for (const s of spawns) {
      this.enemies.push(new DummyEnemy(this.scene, s.x, s.kind));
    }

    this.player.update(dt);

    for (const e of this.enemies) {
      if (e.isAlive) e.update(dt, this.player.root.position);
      else e.update(dt, this.player.root.position); // 死亡沈み用
    }

    // 死亡敵の掃除 (沈んだら破棄)
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.isAlive && e.root.position.y < -0.9) {
        e.dispose();
        this.enemies.splice(i, 1);
      }
    }

    this.resolvePlayerAttacks();
    this.resolveEnemyAttacks();

    // コンボ維持
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.hud.setCombo(0);
      }
    }

    // 斬撃フラッシュ (攻撃判定が出た最初のフレームで表示)
    const serial = this.player.attackSerial;
    if (this.player.isAttackActive() && this.lastSlashSerial !== serial) {
      this.lastSlashSerial = serial;
      const strong = this.player.currentAttackDef()?.reaction === "down";
      const aabb = this.player.getAttackAabb();
      const dir = aabb
        ? aabb.center.x >= this.player.root.position.x
          ? 1
          : -1
        : 1;
      this.slash.show(this.player.root.position, dir, strong);
    }

    this.hitEffect.update(dt);
    this.slash.update(dt);
    this.gameCamera.update(dt === 0 ? realDt : dt);

    // CLEAR判定
    if (this.encounter.cleared && this.enemies.length === 0 && !this.clearShown) {
      this.clearShown = true;
      this.hud.showCenter("CLEAR", "R / Enter でもう一度");
    }
  }

  private resolvePlayerAttacks(): void {
    const def = this.player.currentAttackDef();
    const aabb = this.player.getAttackAabb();
    if (!def || !aabb) return;

    for (const e of this.enemies) {
      if (!e.isAlive) continue;
      if (this.player.hasHit(e.id)) continue;
      if (!this.combat.testAttack(aabb, e.getHurtAabb())) continue;

      const down = def.reaction === "down";
      e.takeDamage(def.damage, this.player.root.position.x, def.knockback, down);
      this.player.markHit(e.id);

      this.combo += 1;
      this.comboTimer = 2.5;
      this.score += def.damage * 10 + this.combo * 5;
      this.hud.setCombo(this.combo);
      this.hud.setScore(this.score);

      this.hitStopTimer = Math.max(this.hitStopTimer, def.hitStop);
      this.gameCamera.addShake(def.cameraShake);

      const big = down || def.reaction === "knockback";
      this.hitEffect.spawn(e.root.position.add(new Vector3(0, 1.2, 0)), big);

      if (!e.isAlive) {
        this.score += 500;
        this.hud.setScore(this.score);
      }
    }
  }

  private resolveEnemyAttacks(): void {
    const victim = this.player.getHurtAabb();
    for (const e of this.enemies) {
      if (!e.isAlive) continue;
      const atk = e.getAttackAabb(this.player.root.position);
      if (!atk) continue;
      if (!e.canHitPlayer(e.attackSerial)) continue;
      if (!this.combat.testAttack(atk, victim)) continue;

      e.markHitPlayer(e.attackSerial);
      if (this.player.isInvincible) continue; // 回避成功: ノーダメージ

      this.player.takeDamage(e.attackDamage, e.root.position.x, true, false);
      this.hud.setHp(this.player.hp, this.player.maxHp);
      this.combo = 0;
      this.comboTimer = 0;
      this.hud.setCombo(0);
      this.hitStopTimer = Math.max(this.hitStopTimer, 0.06);
      this.gameCamera.addShake(0.4);
      this.hitEffect.spawn(
        this.player.root.position.add(new Vector3(0, 1.2, 0)),
        false,
      );
    }
  }

  private createLights(): void {
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.9;
    hemi.diffuse = new Color3(1, 0.97, 0.9);
    hemi.groundColor = new Color3(0.25, 0.3, 0.25);

    const dir = new DirectionalLight("sun", new Vector3(-0.4, -1, 0.3), this.scene);
    dir.intensity = 0.7;
    dir.diffuse = new Color3(1, 0.95, 0.85);
  }
}
