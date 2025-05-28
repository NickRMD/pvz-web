import type GameState from "../GameState";
import type { SpriteKeyEnum } from "../SpriteLoader";
import Signal from "../utils/Signal";

abstract class Entity {
  protected _x = new Signal(0);
  protected _y = new Signal(0);
  protected abstract _target_x?: Signal<number> | number | (() => (number | Signal<number>)) | null;
  protected abstract _target_y?: Signal<number> | number | (() => (number | Signal<number>)) | null;
  protected abstract _health?: number | Signal<number>;
  protected abstract _max_health?: number;
  protected abstract _damage?: number | Signal<number>;
  protected readonly _game_state: Pick<
    GameState,
    | "mut_zombies"
    | "zombies"
    | "mut_plants"
    | "plants"
    | "grid"
    | "produce_sun"
    | "sprite_loader"
    | "shoot_projectile"
    | "entities"
    | "get_grid_position"
  >;
  protected abstract _height: number;
  protected abstract _width: number;
  protected abstract _hex_color: string;
  protected abstract _sprite: SpriteKeyEnum;
  protected abstract _time_since_last_action?: number;

  constructor(game_state: GameState) {
    this._game_state = game_state;
  }

  public abstract update(delta_s: number): void;
  public abstract draw(ctx: CanvasRenderingContext2D): void;

  public x() {
    return this._x;
  }

  public y() {
    return this._y;
  }

  public height(): Readonly<number> {
    return this._height;
  }

  public width(): Readonly<number> {
    return this._width;
  }

  public target_x() {
    if (!this._target_y)
      throw new Error("Target X is not implemented for this Entity");
    return this._target_x;
  }

  public target_y() {
    if (!this._target_y)
      throw new Error("Target Y is not implemented for this Entity");
    return this._target_y;
  }
}

export default Entity;
