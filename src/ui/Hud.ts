export class Hud {
  private readonly combo = document.querySelector<HTMLElement>("#combo");
  private readonly score = document.querySelector<HTMLElement>("#score");
  private readonly hpFill = document.querySelector<HTMLElement>("#hp-fill");
  private readonly center = document.querySelector<HTMLElement>("#center");
  private readonly centerTitle = document.querySelector<HTMLElement>("#center-title");
  private readonly centerSub = document.querySelector<HTMLElement>("#center-sub");

  public setCombo(value: number): void {
    if (this.combo) this.combo.textContent = String(value);
  }

  public setScore(value: number): void {
    if (this.score) this.score.textContent = String(value).padStart(6, "0");
  }

  public setHp(current: number, max: number): void {
    if (!this.hpFill) return;
    const k = Math.max(0, Math.min(1, current / max));
    this.hpFill.style.width = `${k * 100}%`;
    this.hpFill.style.background = k <= 0.25 ? "#ff3b30" : "#e85b67";
  }

  public showCenter(title: string, sub = ""): void {
    if (!this.center) return;
    if (this.centerTitle) this.centerTitle.textContent = title;
    if (this.centerSub) this.centerSub.textContent = sub;
    this.center.style.display = "flex";
  }

  public hideCenter(): void {
    if (!this.center) return;
    this.center.style.display = "none";
  }
}
