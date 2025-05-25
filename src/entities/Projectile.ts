import type GameState from "../GameState";
import Signal from "../utils/Signal";
import Entity from "./Entity";

abstract class Projectile extends Entity {
  protected _target_x: Signal<number>;
  protected _target_y: Signal<number>;
  protected _damage: number;
  private _speed: number;
  protected _reached = false;
  private _angle: number;

  protected _health: undefined;
  protected _max_health: undefined;

  constructor(
    x: number,
    y: number,
    target_x: number,
    target_y: number,
    damage: number,
    speed: number,
    game_state: GameState,
    /*type = "basic"*/
  ) {
    super(game_state);
    this._x = new Signal(x);
    this._y = new Signal(y);
    this._target_x = new Signal(target_x);
    this._target_y = new Signal(target_y);
    this._damage = damage;
    this._speed = speed;
    // this.type = type;
    this._angle = Math.atan2(target_y - y, target_x - x);
  }

  public update() {
    const dx = this._target_x.value - this._x.value;
    const dy = this._target_y.value - this._y.value;
    const distance = Math.sqrt(dx ** 2 + dy ** 2);

    if (distance < this._speed) {
      this._reached = true;
      this._hit_target();
    } else {
      // this._x.value += ((dx / distance) * this._speed);
      // this._y.value += ((dy / distance) * this._speed);
      this._x.value += (dx / distance) * this._speed;
      this._y.value += (dy / distance) * this._speed;
    }
  }

  public reached(): Readonly<boolean> {
    return this._reached;
  }

  protected abstract _hit_target(): void;

  public draw(ctx: CanvasRenderingContext2D) {
    const sprite = this._game_state.sprite_loader.sprites()[this._sprite];
    if (sprite.complete) {
      ctx.save();
      ctx.translate(this._x.value, this._y.value);
      ctx.rotate(this._angle);
      ctx.drawImage(
        sprite,
        -this._width / 2,
        -this._height / 2,
        this._width,
        this._height,
      );
      ctx.restore();
    } else {
      ctx.fillStyle = this._hex_color;
      ctx.beginPath();
      ctx.arc(this._x.value, this._y.value, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default Projectile;
