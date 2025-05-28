import Zombie from "../Zombie";
import { SpriteKeyEnum } from "../../SpriteLoader";
import Signal from "../../utils/Signal";

class ZombieBasic extends Zombie {
  protected _base_health() {
    return 100;
  }
  protected _damage = new Signal(0.5);
  protected _time_since_last_action: undefined;
  public readonly base_speed = 30;
  public current_speed = 30;
  protected _time_to_move = 5;

  protected _height = 80;
  protected _width = 40;
  protected _sprite = SpriteKeyEnum.ZombieBasic;
  protected _hex_color = "#607D8B";
}

export default ZombieBasic;
