import Plant from "../Plant";

export default class Shooter extends Plant {
	update(timestamp) {
		if (timestamp - this.lastActionTime > this.attackSpeed) {
			const zombieInRow = gameState.zombies.find(
				(z) =>
					z.row === this.row &&
					z.x > this.col * gameState.grid.cellWidth &&
					z.x >= gameState.grid.offsetX &&
					z.x <=
						gameState.grid.offsetX +
							gameState.grid.cols * gameState.grid.cellWidth,
			);

			if (zombieInRow) {
				shootProjectile(this, zombieInRow);
				this.lastActionTime = timestamp;
			}
		}
	}
}
