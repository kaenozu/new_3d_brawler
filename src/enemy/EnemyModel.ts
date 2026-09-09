import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";
import type { EnemyAIState } from "./EnemyAI";

export type EnemyKind = "blob" | "golem";

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t));
}

/**
 * プリミティブ組み立ての敵モデル。
 * Blob:  Skeletonなしで成立するスライム (潰れ・ホップで動く)
 * Golem: 岩人形 (歩行/パンチ)
 * +Zを正面として造形し、innerのY回転で向きを付ける。
 */
export class EnemyModel {
  public readonly outer: TransformNode;
  private readonly inner: TransformNode;
  private readonly kind: EnemyKind;

  // Blob用
  private blobBody: Mesh | null = null;

  // Golem用
  private torso: Mesh | null = null;
  private head: Mesh | null = null;
  private shoulderR: TransformNode | null = null;
  private shoulderL: TransformNode | null = null;
  private elbowR: TransformNode | null = null;
  private elbowL: TransformNode | null = null;
  private legR: TransformNode | null = null;
  private legL: TransformNode | null = null;

  private idleTime = 0;
  private phase = 0;

  private readonly mats: { m: StandardMaterial; base: Color3 }[] = [];
  private readonly meshes: Mesh[] = [];

  public constructor(
    private readonly scene: Scene,
    parent: TransformNode,
    kind: EnemyKind,
  ) {
    this.kind = kind;
    this.outer = new TransformNode(`enemyOuter-${kind}`, scene);
    this.outer.parent = parent;
    this.inner = new TransformNode(`enemyInner-${kind}`, scene);
    this.inner.parent = this.outer;

    if (kind === "blob") this.buildBlob();
    else this.buildGolem();

    this.setFacing(1);
    this.resetPose();
  }

  public setFacing(dir: 1 | -1): void {
    this.inner.rotation.y = dir === 1 ? Math.PI / 2 : -Math.PI / 2;
  }

  public flash(on: boolean): void {
    for (const e of this.mats) {
      if (on) e.m.diffuseColor = new Color3(1, 0.4, 0.35);
      else e.m.diffuseColor.copyFrom(e.base);
    }
  }

  public dispose(): void {
    for (const mesh of this.meshes) mesh.dispose();
    for (const e of this.mats) e.m.dispose();
    this.inner.dispose();
    this.outer.dispose();
  }

  // ---------- Blob ----------
  private buildBlob(): void {
    const slime = this.makeMat("slime", new Color3(0.32, 0.72, 0.52));
    const white = this.makeMat("eyeW", new Color3(0.95, 0.97, 0.95));
    const dark = this.makeMat("eyeB", new Color3(0.08, 0.1, 0.1));

    this.blobBody = this.ball("body", 1.1, slime, this.inner, 0, 0.5, 0);
    this.blobBody.scaling.set(1, 0.85, 1);
    this.ball("eyeR", 0.18, white, this.inner, 0.16, 0.62, 0.4);
    this.ball("eyeL", 0.18, white, this.inner, -0.16, 0.62, 0.4);
    this.ball("pupilR", 0.08, dark, this.inner, 0.16, 0.62, 0.5);
    this.ball("pupilL", 0.08, dark, this.inner, -0.16, 0.62, 0.5);
    this.box("mouth", 0.18, 0.05, 0.03, dark, this.inner, 0, 0.36, 0.5);
  }

  // ---------- Golem ----------
  private buildGolem(): void {
    const rock = this.makeMat("rock", new Color3(0.45, 0.44, 0.4));
    const darkRock = this.makeMat("darkRock", new Color3(0.3, 0.29, 0.27));
    const moss = this.makeMat("moss", new Color3(0.3, 0.52, 0.24));
    const glow = this.makeMat(
      "glow",
      new Color3(1, 0.5, 0.12),
      new Color3(0.9, 0.4, 0.08),
    );

    // 脚 (付け根ピボット y=0.62)
    this.legR = this.node("legR", this.inner, 0.17, 0.62, 0);
    this.legL = this.node("legL", this.inner, -0.17, 0.62, 0);
    for (const leg of [this.legR, this.legL]) {
      this.box("thigh", 0.24, 0.5, 0.28, rock, leg, 0, -0.25, 0);
      this.box("foot", 0.26, 0.14, 0.42, darkRock, leg, 0, -0.55, 0.05);
    }

    // 胴・苔・コア
    this.torso = this.box("torso", 0.85, 0.7, 0.55, rock, this.inner, 0, 1.0, 0);
    this.box("mossChest", 0.3, 0.22, 0.03, moss, this.inner, -0.2, 0.92, 0.29);
    this.box("mossBack", 0.24, 0.18, 0.03, moss, this.inner, 0.15, 1.15, -0.29);
    const core = MeshBuilder.CreateCylinder(
      "enemy-core",
      { height: 0.06, diameter: 0.18, tessellation: 12 },
      this.scene,
    );
    core.material = glow;
    core.parent = this.inner;
    core.position.set(0.08, 1.02, 0.29);
    core.rotation.x = Math.PI / 2;
    this.meshes.push(core);

    // 頭・眉・目
    this.head = this.box("head", 0.38, 0.3, 0.36, darkRock, this.inner, 0, 1.52, 0);
    this.box("brow", 0.44, 0.1, 0.4, rock, this.inner, 0, 1.64, 0);
    this.box("eyeR", 0.07, 0.07, 0.03, glow, this.inner, 0.1, 1.5, 0.19);
    this.box("eyeL", 0.07, 0.07, 0.03, glow, this.inner, -0.1, 1.5, 0.19);

    // 肩当て
    this.box("padR", 0.3, 0.18, 0.34, darkRock, this.inner, 0.56, 1.32, 0);
    this.box("padL", 0.3, 0.18, 0.34, darkRock, this.inner, -0.56, 1.32, 0);

    // 腕
    this.shoulderR = this.node("shoulderR", this.inner, 0.56, 1.24, 0);
    this.shoulderL = this.node("shoulderL", this.inner, -0.56, 1.24, 0);
    for (const sh of [this.shoulderR, this.shoulderL]) {
      this.box("upperArm", 0.26, 0.5, 0.3, rock, sh, 0, -0.25, 0);
    }
    this.elbowR = this.node("elbowR", this.shoulderR, 0, -0.5, 0);
    this.elbowL = this.node("elbowL", this.shoulderL, 0, -0.5, 0);
    for (const el of [this.elbowR, this.elbowL]) {
      this.box("foreArm", 0.28, 0.45, 0.32, darkRock, el, 0, -0.22, 0);
      this.box("fist", 0.36, 0.34, 0.36, rock, el, 0, -0.52, 0);
    }
  }

  public resetPose(): void {
    this.inner.position.set(0, 0, 0);
    this.inner.rotation.x = 0;
    this.inner.rotation.z = 0;
    if (this.kind === "blob") {
      this.blobBody?.scaling.set(1, 0.85, 1);
      this.blobBody?.position.set(0, 0.5, 0);
      return;
    }
    this.torso?.rotation.set(0, 0, 0);
    this.head?.rotation.set(0, 0, 0);
    this.shoulderR?.rotation.set(0, 0, -0.12);
    this.shoulderL?.rotation.set(0, 0, 0.12);
    this.elbowR?.rotation.set(-0.15, 0, 0);
    this.elbowL?.rotation.set(-0.15, 0, 0);
    this.legR?.rotation.set(0, 0, 0);
    this.legL?.rotation.set(0, 0, 0);
  }

  public animate(state: EnemyAIState, stateTime: number, dt: number): void {
    this.idleTime += dt;
    this.resetPose();
    if (this.kind === "blob") this.animateBlob(state, stateTime, dt);
    else this.animateGolem(state, stateTime, dt);
  }

  private animateBlob(state: EnemyAIState, st: number, dt: number): void {
    const body = this.blobBody;
    if (!body) return;
    const t = this.idleTime;

    switch (state) {
      case "Idle": {
        const sy = 0.85 + Math.sin(t * 3) * 0.03;
        body.scaling.set(1, sy, 1);
        body.position.y = 0.55 * sy;
        break;
      }
      case "Approach": {
        this.phase += dt * 7;
        const hop = Math.abs(Math.sin(this.phase));
        this.inner.position.y = hop * 0.28;
        const sy = 0.85 - (1 - hop) * 0.12;
        const sxz = 1 + (1 - hop) * 0.1;
        body.scaling.set(sxz, sy, sxz);
        body.position.y = 0.55 * sy;
        break;
      }
      case "Attack": {
        if (st < 0.28) {
          const k = st / 0.28;
          body.scaling.set(lerp(1, 1.25, k), lerp(0.85, 0.6, k), lerp(1, 1.2, k));
        } else {
          const k = clamp01((st - 0.28) / 0.32);
          body.scaling.set(lerp(1.25, 0.95, k), lerp(0.6, 1.15, k), lerp(1.2, 0.95, k));
          this.inner.position.z = 0.45 * Math.sin(k * Math.PI);
        }
        body.position.y = 0.55 * body.scaling.y;
        break;
      }
      case "Cooldown": {
        this.inner.rotation.z = Math.sin(t * 18) * 0.04;
        body.position.y = 0.55 * body.scaling.y;
        break;
      }
      case "Hit": {
        const k = clamp01(st / 0.32);
        body.scaling.set(1.2, 0.65, 1.1);
        body.position.y = 0.55 * 0.65;
        this.inner.position.x = Math.sin(st * 60) * 0.06 * (1 - k);
        break;
      }
      case "Down": {
        body.scaling.set(1.45, 0.32, 1.35);
        body.position.y = 0.55 * 0.32;
        break;
      }
      case "Dead": {
        const s = Math.max(0.15, 1 - st * 0.6);
        body.scaling.set(1.45 * s, 0.3 * s, 1.35 * s);
        body.position.y = 0.55 * 0.3 * s;
        break;
      }
    }
  }

  private animateGolem(state: EnemyAIState, st: number, dt: number): void {
    const t = this.idleTime;
    const shR = this.shoulderR;
    const shL = this.shoulderL;
    const elR = this.elbowR;
    const elL = this.elbowL;
    if (!shR || !shL || !elR || !elL || !this.torso || !this.head) return;

    switch (state) {
      case "Idle": {
        shR.rotation.x = Math.sin(t * 1.8) * 0.05;
        shL.rotation.x = -Math.sin(t * 1.8) * 0.05;
        this.head.rotation.y = Math.sin(t * 0.6) * 0.25;
        break;
      }
      case "Approach": {
        this.phase += dt * 5;
        const s = Math.sin(this.phase);
        this.legR?.rotation.set(s * 0.45, 0, 0);
        this.legL?.rotation.set(-s * 0.45, 0, 0);
        shR.rotation.x = -s * 0.3;
        shL.rotation.x = s * 0.3;
        this.torso.rotation.y = s * 0.07;
        this.inner.position.y = Math.abs(Math.cos(this.phase)) * 0.05;
        break;
      }
      case "Attack": {
        if (st < 0.28) {
          const k = st / 0.28; // 溜め
          shR.rotation.set(lerp(-0.2, 1.0, k), 0, -0.12);
          elR.rotation.set(0, 0, 0);
          elR.rotation.x = lerp(-0.2, -1.4, k);
          this.torso.rotation.y = lerp(0, -0.5, k);
        } else {
          const k = clamp01((st - 0.28) / 0.32); // 殴り
          shR.rotation.set(lerp(1.0, -1.6, k), 0, -0.05);
          elR.rotation.set(lerp(-1.4, -0.05, k), 0, 0);
          this.torso.rotation.y = lerp(-0.5, 0.4, k);
          this.head.rotation.x = 0.2 * k;
          this.inner.position.z = 0.35 * Math.sin(k * Math.PI);
        }
        shL.rotation.set(-0.4, 0, 0.3);
        break;
      }
      case "Cooldown": {
        shR.rotation.set(-0.7, 0, -0.2);
        shL.rotation.set(-0.7, 0, 0.2);
        elR.rotation.set(-1.0, 0, 0);
        elL.rotation.set(-1.0, 0, 0);
        this.inner.position.y = -0.06;
        break;
      }
      case "Hit": {
        this.torso.rotation.x = -0.3;
        this.head.rotation.x = -0.3;
        shR.rotation.set(0.6, 0, -0.5);
        shL.rotation.set(0.6, 0, 0.5);
        break;
      }
      case "Down":
      case "Dead": {
        shR.rotation.set(0.3, 0, -1.0);
        shL.rotation.set(0.3, 0, 1.0);
        this.legR?.rotation.set(-0.15, 0, 0);
        this.legL?.rotation.set(0.12, 0, 0);
        break;
      }
    }
  }

  // ---- ヘルパー ----
  private makeMat(name: string, color: Color3, emissive?: Color3): StandardMaterial {
    const m = new StandardMaterial(`enemy-${name}`, this.scene);
    m.diffuseColor = color.clone();
    m.specularColor = new Color3(0.05, 0.05, 0.05);
    m.emissiveColor = emissive ? emissive.clone() : new Color3(0, 0, 0);
    this.mats.push({ m, base: color.clone() });
    if (emissive) this.mats.pop();
    return m;
  }

  private node(name: string, parent: TransformNode, x: number, y: number, z: number): TransformNode {
    const n = new TransformNode(`enemy-${name}`, this.scene);
    n.parent = parent;
    n.position.set(x, y, z);
    return n;
  }

  private box(
    name: string,
    w: number,
    h: number,
    d: number,
    mat: StandardMaterial,
    parent: TransformNode,
    x: number,
    y: number,
    z: number,
  ): Mesh {
    const mesh = MeshBuilder.CreateBox(`enemy-${name}`, { width: w, height: h, depth: d }, this.scene);
    mesh.material = mat;
    mesh.parent = parent;
    mesh.position.set(x, y, z);
    this.meshes.push(mesh);
    return mesh;
  }

  private ball(
    name: string,
    diameter: number,
    mat: StandardMaterial,
    parent: TransformNode,
    x: number,
    y: number,
    z: number,
  ): Mesh {
    const mesh = MeshBuilder.CreateSphere(`enemy-${name}`, { diameter }, this.scene);
    mesh.material = mat;
    mesh.parent = parent;
    mesh.position.set(x, y, z);
    this.meshes.push(mesh);
    return mesh;
  }
}
