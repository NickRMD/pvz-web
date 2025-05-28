import Entity from "./Entity";
import type GameState from "../GameState";
import Signal from "../utils/Signal";
import { match } from "ts-pattern";
import Difficulty from "./Difficulty";
import { down_scale_sprite } from "../utils/downScaleImage";

abstract class Zombie extends Entity {
  protected _row: number;
  protected _target_row: number | null = null;
  protected _max_health: number;
  protected _health: Signal<number>;
  protected _target_y: undefined;
  protected _target_x: undefined;
  protected abstract _damage: Signal<number>;
  protected abstract _time_to_move: number;
  protected _time_since_last_move = 0;
  public readonly abstract base_speed: number;
  public abstract current_speed: number;

  protected abstract _base_health(): number;

  constructor(
    row: number,
    x: number,
    difficulty: Difficulty,
    current_level: number,
    game_state: GameState,
  ) {
    super(game_state);

    let level = current_level;

    if (level === 0) level = 0.5;

    const health = match(difficulty)
      .returnType<number>()
      .with(Difficulty.Easy, () => this._base_health() * (level / 4))
      .with(Difficulty.Normal, () => this._base_health() * (level / 3))
      .with(Difficulty.Hard, () => this._base_health() * (level / 2))
      .with(Difficulty.Nightmare, () => this._base_health() * level)
      .exhaustive();

    this._health = new Signal(health);
    this._max_health = health;

    this._row = row;
    this._x.value = x;
    this._y.value = 
      this._game_state.grid().offset_y +
      this._row * this._game_state.grid().cell_height +
      this._game_state.grid().cell_height / 2;
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

  public update(delta: number) {
    this.x().value -= this.current_speed * delta;
    this._time_since_last_move += delta;

    if(Math.random() < 0.1 && this._time_since_last_move >= this._time_to_move) {
      if(this._row === 0) {
        this._target_row = this._row + 1;
      } else if(this._row === this._game_state.grid().rows - 1) {
        this._target_row = this._row - 1;
      } else if(Math.random() < 0.50) {
        this._target_row = this._row + 1;
      } else {
        this._target_row = this._row - 1;
      }
    }

    if(this._time_since_last_move >= this._time_to_move) {
      this._time_since_last_move = 0;
    }

    let gridPos: {
      row: number;
      col: number;
      x: number;
      y: number;
    } | null;

    if (typeof this._target_row === "number") {
      const targetY = this._game_state.grid().offset_y +
        this._target_row * this._game_state.grid().cell_height +
        this._game_state.grid().cell_height / 2;
      const dy = targetY - this._y.value;
      const distance = Math.abs(dy); // Only vertical distance

      if (distance < (this.current_speed * delta)) {
        this._row = this._target_row;
        this._target_row = null;
      } else {
        this._y.value += (dy / distance) * (this.base_speed * 1.5) * delta;
      }
      gridPos = this._game_state.get_grid_position(this._x.value, this._y.value);
    } else {
      gridPos = this._game_state.get_grid_position(
        this._x.value,
        this._game_state.grid().offset_y +
          this.row() * this._game_state.grid().cell_height +
          this._game_state.grid().cell_height / 2,
        );
    }


    if (gridPos) {
      const plant = this._game_state
        .plants()
        .find((p) => p.row() === gridPos.row && p.col() === gridPos.col);
      if (!plant) {
        this.current_speed = this.base_speed;
      }
      if (plant) {
        this.current_speed = 0;
        plant.health().value -= this.damage().value;
        if (plant.health().value <= 0) {
          this._game_state
            .entities()
            .mutate((e) =>
              e.splice(this._game_state.entities().value.indexOf(plant), 1),
            );
          this.current_speed = this.base_speed * delta;
        }
      }
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    let y = 1;
    if(typeof this._target_row === "number") {
      y = this._y.value;
    } else {
      y = this._game_state.grid().offset_y + this._row *
        this._game_state.grid().cell_height +
        this._game_state.grid().cell_height / 2;
    }

    const cached_sprite =
      this._game_state.sprite_loader.cached_sprites()[this._sprite];
    const sprite = cached_sprite
      ? cached_sprite
      : (() => {
          const sprite = this._game_state.sprite_loader.sprites()[this._sprite];

          const new_image = down_scale_sprite(sprite, this._width, this._width);
          this._game_state.sprite_loader.set_sprite(this._sprite, new_image);

          return new_image;
        })();

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
