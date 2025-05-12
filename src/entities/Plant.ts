import Entity from "./Entity";

class Plant extends Entity {
	constructor(type, row, col) {
		this.type = type;
		this.row = row;
		this.col = col;
		this.health = plantTypes[type].health;
		this.maxHealth = plantTypes[type].health;
		this.lastActionTime = 0;
		Object.assign(this, plantTypes[type]);
		this._x =
			gameState.grid.offsetX +
			col * gameState.grid.cellWidth +
			gameState.grid.cellWidth / 2;
		this._y =
			gameState.grid.offsetY +
			row * gameState.grid.cellHeight +
			gameState.grid.cellHeight / 2;
	}

	update(timestamp) {}

	draw(ctx) {
		if (this.sprite.complete) {
			const aspectRatio = this.sprite.width / this.sprite.height;
			const width = this.width;
			const height = this.width / aspectRatio;

			ctx.drawImage(
				this.sprite,
				this.x - width / 2,
				this.y - height / 2,
				width,
				height,
			);
		} else {
			ctx.fillStyle = this.color;
			ctx.beginPath();
			ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
			ctx.fill();
		}

		// Barra de saúde
		const healthPercent = this.health / this.maxHealth;
		ctx.fillStyle =
			healthPercent > 0.5
				? "#4CAF50"
				: healthPercent > 0.2
					? "#FFC107"
					: "#F44336";
		ctx.fillRect(this.x - 25, this.y + 35, 50 * healthPercent, 5);
	}
}

export default Plant;
