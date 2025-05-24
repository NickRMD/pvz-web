import Zombie from "../Zombie";
import { SpriteKeyEnum } from "../../SpriteLoader";
import Signal from "../../utils/Signal";

class ZombieCone extends Zombie {
  protected readonly _base_health = 100;
  protected _damage = new Signal(0.5);
  public speed = 0.4;

  protected _height = 85;
  protected _width = 45;
  protected _sprite = SpriteKeyEnum.ZombieCone;
  protected _hex_color = "#FF9800";
}

export default ZombieCone;
