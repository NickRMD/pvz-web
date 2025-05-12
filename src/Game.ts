import CanvasHandler from "./CanvasHandler";
import Sun from "./entities/Sun";
import GameState from "./GameState.ts";
import CollisionSystem from "./gameSystems/CollisionSystem";
import WaveSystem from "./gameSystems/WaveSystem";
import SpriteLoader from "./SpriteLoader";

class Game {
	private _sprite_loader = new SpriteLoader();
	private _canvas_handler = new CanvasHandler();
	private _game_state = new GameState();
	private _collision_system: CollisionSystem;
	private _wave_system: WaveSystem;

	constructor() {
		this._collision_system = new CollisionSystem();
		this._wave_system = new WaveSystem(this.rows, this._game_state.add_zombie);
	}

	public async start() {
		const loading_sprites = this._sprite_loader.load();
		this._game_state.update_ui();
		this._draw_grid();
		await loading_sprites;
		if (this._sprite_loader.is_loaded()) {
			document.getElementById("loading")!.style.display = "none";
			this._game_state.update_ui();
			// playStartSound();
			requestAnimationFrame(this.game_loop);
		} else {
			throw new Error("There was an error loading sprites!");
		}
	}

	private game_loop(timestamp) {
		if (this._game_state.gameOver) return;
		if (this._game_state.paused) {
			requestAnimationFrame(this.game_loop);
			return;
		}

		// Limpar o canvas
		this._canvas_handler
			.ctx()
			.clearRect(
				0,
				0,
				this._canvas_handler.canvas().width,
				this._canvas_handler.canvas().height,
			);

		this._canvas_handler.draw_background();

		this._collision_system.update([
			...this._game_state.zombies,
			...this._game_state.plants,
		]);
		this._wave_system.update(timestamp);

		this._draw_grid();

		this._game_state.plants.forEach((plant) => plant.update(timestamp));
		this._game_state.plants.forEach((plant) =>
			plant.draw(this._canvas_handler.ctx()),
		);

		this._game_state.projectiles = this._game_state.projectiles.filter(
			(proj) => {
				proj.update();
				proj.draw(this._canvas_handler.ctx());
				return !proj.reached;
			},
		);

		this._game_state.zombies.forEach((zombie) => {
			zombie.x -= zombie.speed;

			const gridPos = this._game_state.getGridPosition(
				zombie.x,
				this._game_state.grid.offsetY +
					zombie.row * this._game_state.grid.cellHeight,
			);
			if (gridPos) {
				const plant = this._game_state.plants.find(
					(p) => p.row === gridPos.row && p.col === gridPos.col,
				);
				if (!plant) {
					zombie.speed = 0.5;
				}
				if (plant) {
					zombie.speed = 0;
					plant.health -= zombie.damage;
					if (plant.health <= 0) {
						this._game_state.plants.splice(
							this._game_state.plants.indexOf(plant),
							1,
						);
						zombie.speed = 0.5;
					}
				}
			}

			if (zombie.x < this._game_state.grid.offsetX) {
				this.game_over();
				return;
			}
		});

		this._game_state.zombies.forEach((zombie) => drawZombie(zombie));

		if (this._game_state.suns) {
			this._game_state.suns = this._game_state.suns.filter((sun) =>
				sun.update(),
			);
			this._game_state.suns.forEach((sun) =>
				sun.draw(this._canvas_handler.ctx()),
			);
		}

		if (
			timestamp - this._game_state.lastSunTime >
			this._game_state.sunInterval
		) {
			generateRandomSun();
			this._game_state.lastSunTime = timestamp;
		}

		requestAnimationFrame(this.game_loop);
	}

	private _setup_listeners() {
		document.querySelectorAll(".plant-icon").forEach((icon) => {
			icon.addEventListener("click", (e) => {
				if (this._game_state.gameOver || this._game_state.paused) return;

				const plantType = e.currentTarget.getAttribute("data-plant");
				const cost = parseInt(e.currentTarget.getAttribute("data-cost"));

				if (this._game_state.sun >= cost) {
					this._game_state.draggingPlant = {
						type: plantType,
						cost: cost,
						element: e.currentTarget,
					};
					e.currentTarget.style.opacity = "0.5";

					const preview = document.getElementById("plantPreview");
					preview.style.display = "block";
					preview.style.backgroundImage = `url('${plantTypes[plantType].sprite.src}')`;
				}
			});
		});

		document.addEventListener("mousemove", (e) => {
			if (this._game_state.draggingPlant) {
				const preview = document.getElementById("plantPreview");
				preview.style.left = `${e.clientX - 25}px`;
				preview.style.top = `${e.clientY - 25}px`;
			}
		});

		document.addEventListener("mouseup", (e) => {
			const preview = document.getElementById("plantPreview");
			preview.style.display = "none";

			if (this._game_state.draggingPlant) {
				this._game_state.draggingPlant.element.style.opacity = "1";

				const gridPos = getGridPosition(e.clientX, e.clientY);
				if (gridPos && !isGridPositionOccupied(gridPos.row, gridPos.col)) {
					this._game_state.sun -= this._game_state.draggingPlant.cost;
					addPlant(
						this._game_state.draggingPlant.type,
						gridPos.row,
						gridPos.col,
					);
					updateUI();
				}

				this._game_state.draggingPlant = null;
			}
		});

		this._canvas_handler.mut_canvas().addEventListener("click", (e) => {
			if (this._game_state.gameOver || this._game_state.paused) return;

			if (this._game_state.suns) {
				const rect = this._canvas_handler.canvas().getBoundingClientRect();
				const clickX = e.clientX - rect.left;
				const clickY = e.clientY - rect.top;

				for (let i = this._game_state.suns.length - 1; i >= 0; i--) {
					const sun = this._game_state.suns[i];
					const distance = Math.sqrt(
						Math.pow(clickX - sun.x, 2) + Math.pow(clickY - sun.y, 2),
					);

					if (distance < 30 && !sun.collected) {
						sun.collected = true;
						this._game_state.sun += sun.value;
						updateUI();

						const sunEffect = document.createElement("div");
						sunEffect.className = "sun-effect";
						sunEffect.style.left = `${clickX - 15}px`;
						sunEffect.style.top = `${clickY - 15}px`;
						document.body.appendChild(sunEffect);

						setTimeout(() => {
							document.body.removeChild(sunEffect);
						}, 1000);

						this._game_state.suns.splice(i, 1);
						break;
					}
				}
			}
		});

		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				this._game_state.paused = !this._game_state.paused;
				document.getElementById("pauseMenu").style.display = this._game_state
					.paused
					? "flex"
					: "none";
			}

			// Sistema de fusão de plantas (tecla M) a fazer
			if (
				e.key === "m" &&
				!this._game_state.paused &&
				!this._game_state.gameOver
			) {
				document.getElementById("mergeArea").style.display = "flex";
			}

			if (e.key === "Enter" && this._game_state.mergePlants.length === 2) {
				mergePlants();
			}

			if (e.key === "1") {
				const plant = this._game_state.plants[0];
				const cost = plantTypes[plant.type].cost;

				if (this._game_state.sun >= cost) {
					this._game_state.draggingPlant = {
						type: plant.type,
						cost: cost,
						element: document.querySelector(`[data-plant="${plant.type}"]`),
					};
					this._game_state.draggingPlant.element.style.opacity = "0.5";
					document.getElementById("mergeArea").style.display = "none";
				}
			} else if (e.key === "2") {
				this._game_state.mergePlants.push(this._game_state.plants[1]);
				document.getElementById("mergeArea").style.display = "none";
			}
		});

		document.addEventListener("keyup", (e) => {
			if (e.key === "m") {
				mergePlants();
			}
		});
	}

	drawZombie(zombie) {
		const y =
			this._game_state.grid.offsetY +
			zombie.row * this._game_state.grid.cellHeight +
			this._game_state.grid.cellHeight / 2;

		if (zombie.sprite && zombie.sprite.complete) {
			const aspectRatio = zombie.sprite.width / zombie.sprite.height;
			const width = zombie.width;
			const height = zombie.width / aspectRatio;

			this._canvas_handler
				.ctx()
				.drawImage(
					zombie.sprite,
					zombie.x - width / 2,
					y - height / 2,
					width,
					height,
				);
		} else {
			this._canvas_handler.mut_ctx().fillStyle = zombie.color;
			this._canvas_handler.ctx().beginPath();
			this._canvas_handler.ctx().arc(zombie.x, y, 20, 0, Math.PI * 2);
			this._canvas_handler.ctx().fill();
		}

		const healthPercent = zombie.health / zombie.maxHealth;
		this._canvas_handler.mut_ctx().fillStyle =
			healthPercent > 0.5
				? "#4CAF50"
				: healthPercent > 0.2
					? "#FFC107"
					: "#F44336";
		this._canvas_handler
			.ctx()
			.fillRect(
				zombie.x - 20,
				y - zombie.height / 2 - 10,
				40 * healthPercent,
				5,
			);
	}

	private _draw_grid() {
		const { rows, cols, cellWidth, cellHeight, offsetX, offsetY } =
			this._game_state.grid;

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const x = offsetX + col * cellWidth;
				const y = offsetY + row * cellHeight;

				this._canvas_handler.mut_ctx().fillStyle =
					(row + col) % 2 === 0 ? "#8ed04b" : "#7fbf3b";
				this._canvas_handler.mut_ctx().fillRect(x, y, cellWidth, cellHeight);
			}
		}
	}

	generateRandomSun() {
		const sun = new Sun(
			Math.random() * (this._canvas_handler.canvas().width - 100) + 50,
			0,
		);
		sun.targetY =
			Math.random() * (this._canvas_handler.canvas().height - 200) + 100;
		this._game_state.suns.push(sun);
		return sun;
	}

	game_over() {
		this._game_state.gameOver = true;

		this._canvas_handler.mut_ctx().fillStyle = "rgba(0, 0, 0, 0.7)";
		this._canvas_handler
			.ctx()
			.fillRect(
				0,
				0,
				this._canvas_handler.canvas().width,
				this._canvas_handler.canvas().height,
			);

		this._canvas_handler.mut_ctx().fillStyle = "white";
		this._canvas_handler.mut_ctx().font = "48px Arial";
		this._canvas_handler.mut_ctx().textAlign = "center";
		this._canvas_handler
			.ctx()
			.fillText(
				"Game Over",
				this._canvas_handler.canvas().width / 2,
				this._canvas_handler.canvas().height / 2,
			);

		this._canvas_handler.mut_ctx().font = "24px Arial";
		this._canvas_handler
			.ctx()
			.fillText(
				`Você sobreviveu a ${this._game_state.waveCount} waves`,
				this._canvas_handler.canvas().width / 2,
				this._canvas_handler.canvas().height / 2 + 50,
			);

		this._canvas_handler.mut_ctx().fillStyle = "#4CAF50";
		this._canvas_handler
			.ctx()
			.fillRect(
				this._canvas_handler.canvas().width / 2 - 100,
				this._canvas_handler.canvas().height / 2 + 100,
				200,
				50,
			);
		this._canvas_handler.mut_ctx().fillStyle = "white";
		this._canvas_handler.mut_ctx().font = "20px Arial";
		this._canvas_handler
			.ctx()
			.fillText(
				"Jogar Novamente",
				this._canvas_handler.canvas().width / 2,
				this._canvas_handler.canvas().height / 2 + 130,
			);

		this._canvas_handler.canvas().addEventListener(
			"click",
			(e) => {
				const rect = this._canvas_handler.canvas().getBoundingClientRect();
				const x = e.clientX - rect.left;
				const y = e.clientY - rect.top;

				if (
					x >= this._canvas_handler.canvas().width / 2 - 100 &&
					x <= this._canvas_handler.canvas().width / 2 + 100 &&
					y >= this._canvas_handler.canvas().height / 2 + 100 &&
					y <= this._canvas_handler.canvas().height / 2 + 150
				)
					this.reset_game();
			},
			{ once: true },
		);
	}

	resetGame() {
		this._game_state.reset();
		this._wave_system.currentWave = 0;
		this._wave_system.zombiesSpawned = 0;
		this._wave_system.waveActive = false;
		this._wave_system.lastWaveTime = 0;

		this._game_state.update_ui();
		requestAnimationFrame(this.game_loop);
	}
}

export default Game;
