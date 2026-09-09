import type { EnemyKind } from "../enemy/EnemyModel";

export type EncounterDefinition = {
  id: string;
  enemyIds: string[];
  lockMinX: number;
  lockMaxX: number;
};

export type SpawnDef = {
  x: number;
  kind: EnemyKind;
};

/**
 * 簡易ウェーブ進行 (1ライン): Blob→Blob+Golem→Blob+Golem+Golem→CLEAR。
 * Gameが alive数を見てスポーン定義を受け取る。
 */
export class Encounter {
  private readonly waves: SpawnDef[][] = [
    [{ x: 3, kind: "blob" }],
    [
      { x: 2, kind: "blob" },
      { x: 5, kind: "golem" },
    ],
    [
      { x: 0, kind: "blob" },
      { x: 3, kind: "golem" },
      { x: 6, kind: "golem" },
    ],
  ];
  private waveIndex = 0;
  private pending: SpawnDef[] = [];
  private spawnTimer = 0;
  private started = false;
  public cleared = false;

  public start(): void {
    this.waveIndex = 0;
    this.pending = [];
    this.spawnTimer = 0.3;
    this.started = true;
    this.cleared = false;
  }

  public reset(): void {
    this.start();
  }

  /** 毎フレーム呼び出し。スポーンすべき定義リストを返す */
  public update(dt: number, aliveCount: number): SpawnDef[] {
    if (!this.started || this.cleared) return [];
    const out: SpawnDef[] = [];

    // ウェーブ開始
    if (this.pending.length === 0 && aliveCount === 0 && this.waveIndex < this.waves.length) {
      // 次ウェーブ投入 (初回は即時、以降は1秒間隔)
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const wave = this.waves[this.waveIndex];
        this.pending = [...wave];
        this.spawnTimer = 0.5;
      }
      // 全ウェーブ出し切って alive=0 なら CLEAR (pendingが空で最終ウェーブ後)
      if (
        this.waveIndex >= this.waves.length &&
        aliveCount === 0 &&
        this.pending.length === 0
      ) {
        this.cleared = true;
      }
      // pendingができたら落とす
      if (this.pending.length > 0) {
        // このフレームでは1体ずつ出すため下の処理へ
      } else if (this.waveIndex >= this.waves.length) {
        this.cleared = true;
      }
    }

    // pendingを1体ずつ時間差で出す
    if (this.pending.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const def = this.pending.shift() as SpawnDef;
        out.push(def);
        this.spawnTimer = 0.5;
        if (this.pending.length === 0) {
          this.waveIndex += 1;
          this.spawnTimer = 1.2;
          if (this.waveIndex >= this.waves.length && aliveCount === 0) {
            // 最終ウェーブを出し切った直後はGame側でalive判定してCLEARへ
          }
        }
      }
    } else if (this.waveIndex >= this.waves.length && aliveCount === 0 && this.started) {
      this.cleared = true;
    }

    return out;
  }
}
