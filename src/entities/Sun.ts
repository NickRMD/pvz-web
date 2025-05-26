import type GameState from "../GameState";
import { SpriteKeyEnum } from "../SpriteLoader";
import down_scale_image from "../utils/downScaleImage";
import Signal from "../utils/Signal";
import Entity from "./Entity";

class Sun extends Entity {
  private _collected = false;
  private _lifetime = 10000;
  private _value = 50;
  private _spawn_time = performance.now();
  private _speed = 1;

  protected _health: undefined;
  protected _max_health: undefined;
  protected _damage: undefined;
  protected _target_y: Signal<number>;
  protected _target_x: undefined;

  protected _height = 40;
  protected _width = 40;
  protected _sprite = SpriteKeyEnum.Sun;
  protected _hex_color = "#FFD700";

  constructor(x: number, y: number, game_state: GameState, collected = false) {
    super(game_state);
    this._x.value = x;
    this._y.value = y;
    this._target_y = new Signal(y);
    this._collected = collected;
  }

  public value(): Readonly<number> {
    return this._value;
  }

  public collected() {
    return this._collected;
  }

  public collect() {
    this._collected = true;
  }

  public update() {
    if (!this._collected && this._y.value < this._target_y.value) {
      this._y.value += this._speed;
    }

    if (
      !this._collected &&
      performance.now() - this._spawn_time > this._lifetime
    ) {
      this.collect();
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    const cached_sprite =
      this._game_state.sprite_loader.cached_sprites()[this._sprite];
    const sprite = cached_sprite
      ? cached_sprite
      : (() => {
          const sprite = this._game_state.sprite_loader.sprites()[this._sprite];

          const new_image = down_scale_image(sprite, this._width, this._height);
          this._game_state.sprite_loader.set_sprite(this._sprite, new_image);

          return new_image;
        })();

    ctx.drawImage(
      sprite,
      this._x.value - this._width / 2,
      this._y.value - this._height / 2,
      this._width,
      this._height,
    );
  }
}

export default Sun;
