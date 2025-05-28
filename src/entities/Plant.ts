import Signal from "@/utils/Signal";
import type GameState from "../GameState";
import Entity from "./Entity";
import type PlantKind from "./entityKinds/PlantKind";
import { down_scale_sprite } from "../utils/downScaleImage";

abstract class Plant extends Entity {
  protected _row: number;
  protected _col: number;
  protected abstract _health: Signal<number>;
  protected abstract _max_health: number;
  protected abstract _damage: number;
  protected abstract _recharge: number;
  public abstract readonly cost: number;
  public abstract readonly kind: PlantKind;

  protected _target_x: undefined;
  protected _target_y: undefined;

  constructor(row: number, col: number, game_state: GameState) {
    super(game_state);
    this._row = row;
    this._col = col;
    // Não pelo amor de Deus
    // Object.assign(this, plantTypes[type]); 😠
    this._x = new Signal(
      this._game_state.grid().offset_x +
        col * this._game_state.grid().cell_width +
        this._game_state.grid().cell_width / 2,
    );
    this._y = new Signal(
      this._game_state.grid().offset_y +
        row * this._game_state.grid().cell_height +
        this._game_state.grid().cell_height / 2,
    );
  }

  public health() {
    return this._health;
  }

  public damage(): Readonly<number> {
    return this._damage;
  }

  public row(): Readonly<number> {
    return this._row;
  }

  public col(): Readonly<number> {
    return this._col;
  }

  public draw(ctx: CanvasRenderingContext2D) {
    const cached_sprite =
      this._game_state.sprite_loader.cached_sprites()[this._sprite];
    const sprite = cached_sprite
      ? cached_sprite
      : (() => {
          const sprite = this._game_state.sprite_loader.sprites()[this._sprite];

          const new_image = down_scale_sprite(
            sprite,
            this._width,
            this._height,
          );
          this._game_state.sprite_loader.set_sprite(this._sprite, new_image);

          return new_image;
        })();

    const aspectRatio = sprite.width / sprite.height;
    const width = this._width;
    const height = this._width / aspectRatio;

    ctx.drawImage(
      sprite,
      this._x.value - width / 2,
      this._y.value - height / 2,
      width,
      height,
    );

    // Barra de saúde
    const healthPercent = this._health.value / this._max_health;
    ctx.fillStyle =
      healthPercent > 0.5
        ? "#4CAF50"
        : healthPercent > 0.2
          ? "#FFC107"
          : "#F44336";
    ctx.fillRect(this._x.value - 25, this._y.value + 35, 50 * healthPercent, 5);
  }
}

export default Plant;
