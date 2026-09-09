import { Game } from "./core/Game";
import "./ui/style.css";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) {
  throw new Error("#game canvas not found");
}

const game = new Game(canvas);
// デバッグ/自動テスト用ハンドル (本番ビルドでも harmless)
(window as unknown as { __game: Game }).__game = game;
game.start();
