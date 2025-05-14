// const zombie = {
// 	row,
// 	x: grassWidth + zombieAreaWidth,
// 	type,
// 	...zombieTypes[type],
// 	maxHealth: zombieTypes[type].health,
// };

import { match } from "ts-pattern";
import { ZombieType } from "../entityModels/zombieModels";

class Zombie {
	private readonly _row: number;
  private _x: number;
  
  constructor(row: number, x: number, type: ZombieType) {
    this._row = row;
    this._x = x;

    match(type)
    .with(ZombieType.cone, () => {})
    .with(ZombieType.basic, () => {})
    .with(ZombieType.bucket, () => {})
    .exhaustive()

  }

  // private static 
}

export default Zombie;
