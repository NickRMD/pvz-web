import Signal from "@/utils/Signal";
import { SpriteKeyEnum } from "../../SpriteLoader";
import Plant from "../Plant";
import PlantKind from "../entityKinds/PlantKind";
import ProjectileKind, {
  ProjectileDirection,
} from "../entityKinds/ProjectileKind";

export default class Peashooter extends Plant {
  protected _health = new Signal(150);
  protected readonly _max_health = this._health.value;
  protected _damage = 20;
  protected _recharge = 5;
  protected _time_since_last_action = 0;
  public readonly kind = PlantKind.Peashooter;

  public readonly cost = 100;

  protected _height = 50;
  protected _width = 50;
  protected _sprite = SpriteKeyEnum.Peashooter;
  protected _hex_color = "#4CAF50";

  // private _range = 300;
  private _attack_speed = 2;

  public update(delta: number) {
    this._time_since_last_action += delta;

    if (this._time_since_last_action > this._attack_speed) {
      const zombieInRow = this._game_state
        .zombies()
        .find(
          (z) => {
            const grid_pos = this._game_state.get_grid_position(z.x().value, z.y().value);
            if(grid_pos) {
              return grid_pos.row === this._row &&
              z.x().value > this._col * this._game_state.grid().cell_width &&
              z.x().value >= this._game_state.grid().offset_x &&
              z.x().value <=
                this._game_state.grid().offset_x +
                  this._game_state.grid().cols *
                    this._game_state.grid().cell_width;
            };
          });

      if (zombieInRow) {
        this._game_state.shoot_projectile(
          this,
          zombieInRow,
          ProjectileKind.pea,
          ProjectileDirection.PlantToZombie,
        );
        this._time_since_last_action = 0;
      }
    }
  }
}
