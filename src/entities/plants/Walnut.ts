import Signal from "@/utils/Signal";
import { SpriteKeyEnum } from "../../SpriteLoader";
import Plant from "../Plant";
import PlantKind from "../entityKinds/PlantKind";

export default class Walnut extends Plant {
  protected _health = new Signal(400);
  protected readonly _max_health = this._health.value;
  protected _damage = 0;
  protected _recharge = 20;
  public readonly kind = PlantKind.Walnut;

  public readonly cost = 50;

  protected _height = 50;
  protected _width = 50;
  protected _sprite = SpriteKeyEnum.Walnut;
  protected _hex_color = "#8B4513";

  // Planta defensiva, não ataca
  update(): void {}
}
