class Sun {
	constructor(x, y, collected = false) {
		this.x = x;
		this.y = y;
		this.targetY = y;
		this.width = 40;
		this.height = 40;
		this.speed = 1;
		this.collected = collected;
		this.value = 50;
		this.lifetime = 10000;
		this.spawnTime = performance.now();
	}

	update() {
		if (!this.collected && this.y < this.targetY) {
			this.y += this.speed;
		}

		if (!this.collected && performance.now() - this.spawnTime > this.lifetime) {
			return false;
		}

		return true;
	}

	draw(ctx) {
		if (sprites.sun.complete) {
			ctx.drawImage(
				sprites.sun,
				this.x - this.width / 2,
				this.y - this.height / 2,
				this.width,
				this.height,
			);
		} else {
			ctx.fillStyle = "#FFD700";
			ctx.beginPath();
			ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

export default Sun;
