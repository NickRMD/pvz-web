class Projectile {
	constructor(x, y, targetX, targetY, damage, speed, type = "basic") {
		this.x = x;
		this.y = y;
		this.targetX = targetX;
		this.targetY = targetY;
		this.damage = damage;
		this.speed = speed;
		this.type = type;
		this.reached = false;
		this.width = 20;
		this.height = 20;
		this.angle = Math.atan2(targetY - y, targetX - x);
	}

	update() {
		const dx = this.targetX - this.x;
		const dy = this.targetY - this.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < this.speed) {
			this.reached = true;
			this.hitTarget();
		} else {
			this.x += (dx / distance) * this.speed;
			this.y += (dy / distance) * this.speed;
		}
	}

	hitTarget() {
		gameState.zombies.forEach((zombie) => {
			const dx = this.x - zombie.x;
			const dy =
				this.y -
				(gameState.grid.offsetY +
					zombie.row * gameState.grid.cellHeight +
					gameState.grid.cellHeight / 2);
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < this.width / 2 + zombie.width / 2) {
				zombie.health -= this.damage;
				if (zombie.health <= 0) {
					gameState.zombies.splice(gameState.zombies.indexOf(zombie), 1);
					updateUI();
				}
				this.reached = true;
			}
		});
	}

	draw(ctx) {
		if (sprites.projectile.complete) {
			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(this.angle);
			ctx.drawImage(
				sprites.projectile,
				-this.width / 2,
				-this.height / 2,
				this.width,
				this.height,
			);
			ctx.restore();
		} else {
			ctx.fillStyle = "#FF5722";
			ctx.beginPath();
			ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

export default Projectile;
