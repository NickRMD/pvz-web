import Plant from "./entities/Plant";
import Shooter from "./entities/plants/Shooter";
import Sunflower from "./entities/plants/Sunflower";
import WalNut from "./entities/plants/Walnut";
import Projectile from "./entities/Projectile";
import Sun from "./entities/Sun";
import zombieTypes, { ZombieType } from "./models/zombieTypes";

class GameState {
	private _sun: number = 50;
	private _plants: Plant[] = [];
	private _zombies: Zombie[] = [];
	private _projectiles: Projectile[] = [];
	private _suns: Sun[] = [];
	private _last_zombie_time = 0;
	private _zombie_interval = 5000;
	private _last_sun_time = 0;
	private _grid = {
		rows: 5,
		cols: 9,
		cellWidth: grassWidth / 9,
		cellHeight: canvas.height / 5,
		offsetX: 0,
		offsetY: 0,
	};
	private _game_over = false;
	private _paused = true;
  private readonly _wave_count: () => number;
  private readonly _current_level: () => number;
	public selected_plant = null;
	public dragging_plant = null;

	constructor(
    wave_count: () => number,
    current_level: () => number
  ) {
    this._wave_count = wave_count;
    this._current_level = current_level;
		// this.mergePlants = [];
		document.getElementById("pauseMenu")!.style.display = this._paused
			? "flex"
			: "none";
	}

  public rows():number {
    return this._grid.rows;
  }

  public push_sun(sun: Sun) {
    this._suns.push(sun);
  }

	reset() {
		this._sun = 50;
		this._plants = [];
		this._zombies = [];
		this._projectiles = [];
		this._suns = [];
		this._last_zombie_time = 0;
		this._zombie_interval = 5000;
		this._game_over = false;
	}

	getGridPosition(x, y) {
		const col = Math.floor((x - this._grid.offsetX) / this._grid.cellWidth);
		const row = Math.floor((y - this._grid.offsetY) / this._grid.cellHeight);

		if (
			row >= 0 &&
			row < this._grid.rows &&
			col >= 0 &&
			col < this._grid.cols
		) {
			return {
				row,
				col,
				x: this._grid.offsetX + col * this._grid.cellWidth,
				y: this._grid.offsetY + row * this._grid.cellHeight,
			};
		}
		return null;
	}

	isGridPositionOccupied(row, col) {
		return this.plants.some((plant) => plant.row === row && plant.col === col);
	}

	addPlant(type, row, col) {
		let plant: Plant;

		switch (type) {
			case "sunflower":
				plant = new Sunflower(type, row, col);
				break;
			case "peashooter":
			case "peashooter2":
			case "peashooter3":
				plant = new Shooter(type, row, col);
				break;
			case "walnut":
				plant = new WalNut(type, row, col);
				break;
			default:
				plant = new Plant(type, row, col);
		}

		this._plants.push(plant);
		return plant;
	}

	public add_zombie(row, type: ZombieType) {
		const zombie = {
			row,
			x: grassWidth + zombieAreaWidth,
			type,
			...zombieTypes[type],
			maxHealth: zombieTypes[type].health,
		};

		this.zombies.push(zombie);
		this.update_ui();
		return zombie;
	}

	shootProjectile(plant, zombie) {
		const projectile = new Projectile(
			plant.x,
			plant.y,
			zombie.x,
			this._grid.offsetY +
				zombie.row * this._grid.cellHeight +
				this._grid.cellHeight / 2,
			plant.damage,
			5,
		);

		this.projectiles.push(projectile);
	}

	produceSun(x, y) {
		const sun = new Sun(x, y);
		sun.targetY = y + 100;
		this.suns.push(sun);
		return sun;
	}

	public update_ui() {
		document.getElementById("sunCount")!.textContent = this._sun.toString();
		document.getElementById("zombieCount")!.textContent = this._zombies.length.toString();
		document.getElementById("waveCount")!.textContent = this._wave_count().toString();
		document.getElementById("levelCount")!.textContent = this._current_level().toString();
	}
}

export default GameState;
