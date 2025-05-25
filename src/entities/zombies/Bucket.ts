import Zombie from "../Zombie";
import { SpriteKeyEnum } from "../../SpriteLoader";
import Signal from "../../utils/Signal";

class ZombieBucket extends Zombie {
  protected _base_health() {
    return 300;
  }
  protected _damage = new Signal(1);
  public speed = 0.3;

  protected _height = 90;
  protected _width = 50;
  protected _sprite = SpriteKeyEnum.ZombieBucket;
  protected _hex_color = "#9E9E9E";
}

export default ZombieBucket;
