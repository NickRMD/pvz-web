import Entity from "./Entity";
import type GameState from "../GameState";
import Signal from "../utils/Signal";
import { match } from "ts-pattern";
import Difficulty from "./Difficulty";

abstract class Zombie extends Entity {
  private readonly _row: number;
  protected _max_health: number;
  protected _health: Signal<number>;
  protected abstract _base_health: number;
  protected _target_y: undefined;
  protected _target_x: undefined;
  protected abstract _damage: Signal<number>;
  public abstract speed: number;

  constructor(
    row: number,
    x: number,
    difficulty: Difficulty,
    level: number,
    game_state: GameState,
  ) {
    super(game_state);

    const health = match(difficulty)
      .with(Difficulty.Easy, () => this._base_health * (level / 4))
      .with(Difficulty.Normal, () => this._base_health * (level / 3))
      .with(Difficulty.Hard, () => this._base_health * (level / 2))
      .with(Difficulty.Nightmare, () => this._base_health * level)
      .exhaustive();

    this._health = new Signal(health);
    this._max_health = health;

    this._row = row;
    this._x.value = x;
  }

  public health() {
    return this._health;
  }

  public damage() {
    return this._damage;
  }

  public row(): Readonly<number> {
    return this._row;
  }

  public update() {}

  public draw(ctx: CanvasRenderingContext2D) {
    const y =
      this._game_state.grid().offset_y +
      this._row * this._game_state.grid().cell_height +
      this._game_state.grid().cell_height / 2;

    const sprite = this._game_state.sprite_loader.sprites()[this._sprite];
    if (sprite.complete) {
      const aspectRatio = sprite.width / sprite.height;
      const width = this._width;
      const height = this._width / aspectRatio;

      ctx.drawImage(
        sprite,
        this._x.value - width / 2,
        y - height / 2,
        width,
        height,
      );
    } else {
      ctx.fillStyle = this._hex_color;
      ctx.beginPath();
      ctx.arc(this._x.value, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }

    const healthPercent = this._health.value / this._max_health;
    ctx.fillStyle =
      healthPercent > 0.5
        ? "#4CAF50"
        : healthPercent > 0.2
          ? "#FFC107"
          : "#F44336";
    ctx.fillRect(
      this._x.value - 20,
      y - this._height / 2 - 10,
      40 * healthPercent,
      5,
    );
  }
}

export default Zombie;
