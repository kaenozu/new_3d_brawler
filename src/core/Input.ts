export class Input {
  private readonly down = new Set<string>();
  private readonly pressedAt = new Map<string, number>();

  public constructor() {
    window.addEventListener("keydown", (event) => {
      if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight"
      ) {
        event.preventDefault();
      }
      // 初回押しのみ記録 (リピート除外)。バッファ用。
      if (!this.down.has(event.code)) {
        this.pressedAt.set(event.code, performance.now() / 1000);
      }
      this.down.add(event.code);
    });

    window.addEventListener("keyup", (event) => {
      this.down.delete(event.code);
    });

    window.addEventListener("blur", () => {
      this.down.clear();
      this.pressedAt.clear();
    });
  }

  public isDown(code: string): boolean {
    return this.down.has(code);
  }

  /** buffer秒以内の立ち上がりがあればtrue。J/K/L/Space/Esc/R用 */
  public wasPressed(code: string, buffer = 0.18): boolean {
    const t = this.pressedAt.get(code);
    if (t === undefined) return false;
    return performance.now() / 1000 - t <= buffer;
  }

  public consume(code: string): void {
    this.pressedAt.delete(code);
  }

  public getMoveAxis(): { x: number; z: number } {
    const x =
      (this.isDown("KeyD") || this.isDown("ArrowRight") ? 1 : 0) -
      (this.isDown("KeyA") || this.isDown("ArrowLeft") ? 1 : 0);
    const z =
      (this.isDown("KeyS") || this.isDown("ArrowDown") ? 1 : 0) -
      (this.isDown("KeyW") || this.isDown("ArrowUp") ? 1 : 0);
    return { x, z };
  }
}
