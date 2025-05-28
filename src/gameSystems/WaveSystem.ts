import ZombieKind from "../entities/entityKinds/ZombieKind";

class WaveSystem {
  private _add_zombie: (row: number, zombie_type: ZombieKind) => void;
  private _waves: { zombies: number; types: ZombieKind[]; interval: number }[] =
    [];
  private _level = 0;
  private _total_waves = 0;
  private _current_wave = 0;
  private _zombies_spawned = 0;
  private _zombies_in_wave = 0;
  private _wave_cooldown = 30;
  private _wave_active = false;
  private _rows: () => number;
  private _time_since_last_wave = 0;
  private _time_since_last_spawn = 0;

  constructor(
    rows: () => number,
    add_zombie: (row: number, zombie_type: ZombieKind) => void,
  ) {
    this._rows = rows;
    this._add_zombie = add_zombie;
    this.initialize_waves();
  }

  public level(): Readonly<number> {
    return this._level;
  }

  private _level_up() {
    this._level++;
  }

  initialize_waves() {
    this._waves = [
      { zombies: 5, types: [ZombieKind.Basic], interval: 3 },
      {
        zombies: 8,
        types: [ZombieKind.Basic, ZombieKind.Cone],
        interval: 2.5,
      },
      {
        zombies: 12,
        types: [ZombieKind.Basic, ZombieKind.Cone, ZombieKind.Bucket],
        interval: 2,
      },
      {
        zombies: 15,
        types: [ZombieKind.Basic, ZombieKind.Cone, ZombieKind.Bucket],
        interval: 1.5,
      },
      {
        zombies: 20,
        types: [ZombieKind.Basic, ZombieKind.Cone, ZombieKind.Bucket],
        interval: 1,
      },
    ];
  }

  public update(delta: number, game_over: boolean, paused: boolean) {
    if (game_over || paused) return;

    if (!this._wave_active) {
      this._time_since_last_wave += delta;
      if (this._time_since_last_wave >= this._wave_cooldown) {
        this._start_next_wave();
      }
      return;
    }

    this._time_since_last_spawn += delta;
    const wave = this._waves[this._current_wave];

    if (
      this._zombies_spawned < this._zombies_in_wave &&
      this._time_since_last_spawn >= wave.interval
    ) {
      this.spawn_zombie();
      this._time_since_last_spawn = 0;
      this._zombies_spawned++;

      if (this._zombies_spawned >= this._zombies_in_wave) {
        this._end_wave();
      }
    }
  }

  private _start_next_wave() {
    if (this._current_wave >= this._waves.length) {
      this._current_wave = 0;
      this._level_up();
      this._increase_difficulty();
    }

    this._wave_active = true;
    this._zombies_spawned = 0;
    this._zombies_in_wave =
      this._waves[this._current_wave].zombies + Math.floor(this._level / 2);
    this._time_since_last_wave = 0;

    console.log(
      `Wave ${this._current_wave + 1} iniciada! Nível ${this._level}`,
    );
  }

  private _end_wave() {
    this._wave_active = false;
    this._time_since_last_wave = 0;
    this._current_wave++;
    this._total_waves++;

    console.log(
      `Wave completa! Próxima wave em ${this._wave_cooldown} segundos.`,
    );
  }

  public total_waves(): Readonly<number> {
    return this._total_waves;
  }

  private spawn_zombie() {
    const wave = this._waves[this._current_wave % this._waves.length];
    const zombieType =
      wave.types[Math.floor(Math.random() * wave.types.length)];
    const row = Math.floor(Math.random() * this._rows());
    this._add_zombie(row, zombieType);
  }

  public reset() {
    this._total_waves = 0;
    this._current_wave = 0;
    this._zombies_spawned = 0;
    this._wave_active = false;
    this._time_since_last_wave = 0;
    this._time_since_last_spawn = 0;
  }

  private _increase_difficulty() {
    this._wave_cooldown = Math.max(10, this._wave_cooldown - 2);
    for (const wave of this._waves) {
      wave.interval = Math.max(1, wave.interval - 0.2);
    }
  }
}

export default WaveSystem;
