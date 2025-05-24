import Signal from "@/utils/Signal";
import { SpriteKeyEnum } from "../../SpriteLoader";
import Plant from "../Plant";
import PlantKind from "../entityKinds/PlantKind";

export default class Sunflower extends Plant {
  protected _health = new Signal(100);
  protected readonly _max_health = this._health.value;
  protected _damage = 0;
  protected _recharge = 10;
  public readonly kind = PlantKind.Sunflower;

  public readonly cost = 50;

  protected _height = 50;
  protected _width = 50;
  protected _sprite = SpriteKeyEnum.Sunflower;
  protected _hex_color = "#FFD700";

  // private _sun_production = 45;
  private _sun_production_speed = 15000;

  update(timestamp: number) {
    if (timestamp - this._last_action_time > this._sun_production_speed) {
      this._game_state.produce_sun(this._x.value, this._y.value);
      this._last_action_time = timestamp;
    }
  }
}
