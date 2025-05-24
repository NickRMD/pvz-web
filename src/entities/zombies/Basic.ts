import Zombie from "../Zombie";
import { SpriteKeyEnum } from "../../SpriteLoader";
import Signal from "../../utils/Signal";

class ZombieBasic extends Zombie {
  protected readonly _base_health = 100;
  protected _damage = new Signal(0.5);
  public speed = 0.5;

  protected _height = 80;
  protected _width = 40;
  protected _sprite = SpriteKeyEnum.ZombieBasic;
  protected _hex_color = "#607D8B";
}

export default ZombieBasic;
