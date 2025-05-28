import { SpriteKeyEnum } from "../../SpriteLoader";
import Projectile from "../Projectile";

class Pea extends Projectile {
  protected _width = 20;
  protected _height = 20;
  protected _sprite = SpriteKeyEnum.Pea;
  protected _time_since_last_action: undefined;
  protected _hex_color = "#FF5722";

  protected _hit_target(): void {
    for (const zombie of this._game_state.zombies()) {
      const dx = this._x.value - zombie.x().value;
      const dy =
        this._y.value -
        zombie.y().value;
      const distance = Math.sqrt(dx ** 2 + dy ** 2);

      if (distance < this._width / 2 + zombie.width() / 2) {
        zombie.health().value -= this._damage;
        if (zombie.health().value <= 0) {
          this._game_state
            .entities()
            .mutate((e) =>
              e.splice(this._game_state.entities().value.indexOf(zombie), 1),
            );
        }
        this._reached = true;
      }
    }
  }
}

export default Pea;
