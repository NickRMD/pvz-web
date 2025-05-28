import Zombie from "../Zombie";
import { SpriteKeyEnum } from "../../SpriteLoader";
import Signal from "../../utils/Signal";

class ZombieCone extends Zombie {
  protected _base_health() {
    return 200;
  }
  protected _damage = new Signal(0.5);
  protected _time_since_last_action: undefined;
  public readonly base_speed = 24;
  public current_speed = 24;
  protected _time_to_move = 2;

  protected _height = 85;
  protected _width = 45;
  protected _sprite = SpriteKeyEnum.ZombieCone;
  protected _hex_color = "#FF9800";
}

export default ZombieCone;
