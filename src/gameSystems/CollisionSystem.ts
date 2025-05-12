class CollisionSystem {
	constructor() {
		this.grid = {};
	}

	update(entities) {
		this.grid = {};
		entities.forEach((entity) => {
			const gridX = Math.floor(entity.x / 50);
			const gridY = Math.floor(entity.y / 50);
			const key = `${gridX},${gridY}`;

			if (!this.grid[key]) this.grid[key] = [];
			this.grid[key].push(entity);
		});
	}

	getNearby(x, y, radius) {
		const results = [];
		const gridX = Math.floor(x / 50);
		const gridY = Math.floor(y / 50);

		for (let i = gridX - 1; i <= gridX + 1; i++) {
			for (let j = gridY - 1; j <= gridY + 1; j++) {
				const key = `${i},${j}`;
				if (this.grid[key]) {
					results.push(...this.grid[key]);
				}
			}
		}

		return results.filter((entity) => {
			const dx = entity.x - x;
			const dy = entity.y - y;
			return Math.sqrt(dx * dx + dy * dy) <= radius;
		});
	}
}

export default CollisionSystem;
