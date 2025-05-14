import { ZombieType } from "../models/zombieTypes";

class WaveSystem {
	private _add_zombie: (row: number, zombie_type: ZombieType) => void;
	private _waves: { zombies: number; types: ZombieType[]; interval: number }[] =
		[];
	private _level = 0;
	private _current_wave = 0;
	private _zombies_spawned = 0;
	private _zombies_in_wave = 0;
	private _wave_cooldown = 30000;
	private _last_wave_time = 0;
	private _wave_active = false;
	private _rows: () => number;

	constructor(
		rows: () => number,
		add_zombie: (row: number, zombie_type: ZombieType) => void,
	) {
		this._rows = rows;
		this._add_zombie = add_zombie;
		this.initialize_waves();
	}

	private _level_up() {
		this._level++;
	}

	initialize_waves() {
		this._waves = [
			{ zombies: 5, types: [ZombieType.basic], interval: 3000 },
			{
				zombies: 8,
				types: [ZombieType.basic, ZombieType.cone],
				interval: 2500,
			},
			{
				zombies: 12,
				types: [ZombieType.basic, ZombieType.cone, ZombieType.bucket],
				interval: 2000,
			},
			{
				zombies: 15,
				types: [ZombieType.basic, ZombieType.cone, ZombieType.bucket],
				interval: 1500,
			},
			{
				zombies: 20,
				types: [ZombieType.basic, ZombieType.cone, ZombieType.bucket],
				interval: 1000,
			},
		];
	}

	update(timestamp: number, game_over: boolean, paused: boolean) {
		if (game_over || paused) return;

		if (
			!this._wave_active &&
			timestamp - this._last_wave_time > this._wave_cooldown
		) {
			this.start_next_wave(timestamp);
		}

		if (this._wave_active && this._zombies_spawned < this._zombies_in_wave) {
			if (
				timestamp - this._last_wave_time >
				this._waves[this._current_wave].interval
			) {
				this.spawn_zombie();
				this._last_wave_time = timestamp;
				this._zombies_spawned++;

				if (this._zombies_spawned >= this._zombies_in_wave) {
					this.end_wave();
				}
			}
		}
	}

	start_next_wave(timestamp: number) {
		if (this._current_wave >= this._waves.length) {
			this._current_wave = 0;
			this._level_up();
			this.increase_difficulty();
		}

		this._wave_active = true;
		this._zombies_spawned = 0;
		this._zombies_in_wave =
			this._waves[this._current_wave].zombies + Math.floor(this._level / 2);
		this._last_wave_time = timestamp;

		console.log(
			`Wave ${this._current_wave + 1} iniciada! Nível ${this._level}`,
		);
	}

	end_wave() {
		this._wave_active = false;
		this._last_wave_time = performance.now();
		this._current_wave++;
		// gameState.waveCount++;

		console.log(
			`Wave completada! Próxima wave em ${this._wave_cooldown / 1000} segundos.`,
		);
	}

	public current_wave() {}

	private spawn_zombie() {
		const wave = this._waves[this._current_wave % this._waves.length];
		const zombieType =
			wave.types[Math.floor(Math.random() * wave.types.length)];
		const row = Math.floor(Math.random() * this._rows());
		this._add_zombie(row, zombieType);
	}

	increase_difficulty() {
		this._wave_cooldown = Math.max(10000, this._wave_cooldown - 2000);
		this._waves.forEach((wave) => {
			wave.interval = Math.max(1000, wave.interval - 200);
		});
	}
}

export default WaveSystem;
