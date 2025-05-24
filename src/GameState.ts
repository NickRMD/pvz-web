import { match, P } from "ts-pattern";
import ZombieKind, {
  CommonZombieClasses,
} from "./entities/entityKinds/ZombieKind";
import type Plant from "./entities/Plant";
import Sunflower from "./entities/plants/Sunflower";
import type Projectile from "./entities/Projectile";
import Pea from "./entities/projectiles/Pea";
import Sun from "./entities/Sun";
import type Zombie from "./entities/Zombie";
import PlantKind from "./entities/entityKinds/PlantKind";
import Peashooter from "./entities/plants/Peashooter";
import Walnut from "./entities/plants/Walnut";
import Signal from "./utils/Signal";
import Difficulty from "./entities/Difficulty";
import type CanvasHandler from "./CanvasHandler";
import type SpriteLoader from "./SpriteLoader";
import ProjectileKind from "./entities/entityKinds/ProjectileKind";
import type { ProjectileDirection } from "./entities/entityKinds/ProjectileKind";

interface PlantSelection {
  kind: PlantKind;
  cost: number;
  html_element: HTMLElement;
}

class GameState {
  public sun = 50;
  private _plants: Plant[] = [];
  private _zombies: Zombie[] = [];
  private _projectiles: Signal<Projectile[]> = new Signal([] as Projectile[]);
  private _suns: Signal<Sun[]> = new Signal([] as Sun[]);
  // private _last_zombie_time = 0;
  // private _zombie_interval = 5000;
  public readonly sun_interval = 5000;
  public last_sun_time = 0;
  private _grid = {
    rows: 5,
    cols: 9,
    cellWidth: 0,
    cellHeight: 0,
    offsetX: 0,
    offsetY: 0,
  };
  private _initialized = false;
  private _game_over = false;
  private _paused = false;
  private _wave_count = GameState.UnitializedError as () => number;
  private _current_level = GameState.UnitializedError as () => number;
  public readonly sprite_loader: SpriteLoader;
  private _canvas_handler: CanvasHandler;
  public selected_plant: PlantSelection | null = null;
  public dragging_plant: PlantSelection | null = null;
  public difficulty = Difficulty.Easy;

  constructor(sprite_loader: SpriteLoader, canvas_handler: CanvasHandler) {
    this._canvas_handler = canvas_handler;
    this.sprite_loader = sprite_loader;
    this._resize_grid();
    window.addEventListener("resize", this._resize_grid.bind(this));
    // this.mergePlants = [];
    document.getElementById("pauseMenu")!.style.display = this._paused
      ? "flex"
      : "none";
  }

  private _resize_grid() {
    this._grid.cellHeight = this._canvas_handler.canvas().height / 5;
    this._grid.cellWidth = this._canvas_handler.grass_width() / 9;
  }

  public initialize(
    wave_count: () => Readonly<number>,
    current_level: () => Readonly<number>,
  ) {
    this._wave_count = wave_count;
    this._current_level = current_level;
    this._initialized = true;
  }

  public is_initialized() {
    return this._initialized;
  }

  public is_game_over() {
    return this._game_over;
  }

  public game_over() {
    this._game_over = true;
  }

  public is_paused() {
    return this._paused;
  }

  public toggle_pause() {
    this._paused = !this._paused;
  }

  public rows(): number {
    return this._grid.rows;
  }

  public projectiles() {
    return this._projectiles;
  }

  public suns() {
    return this._suns;
  }

  public zombies(): Readonly<typeof this._zombies> {
    return this._zombies;
  }

  public mut_zombies() {
    return this._zombies;
  }

  public plants(): Readonly<typeof this._plants> {
    return this._plants;
  }

  public mut_plants() {
    return this._plants;
  }

  public grid(): Readonly<typeof this._grid> {
    return this._grid;
  }

  reset() {
    this.sun = 50;
    this._plants = [];
    this._zombies = [];
    this._projectiles.value = [];
    this._suns.value = [];
    // this._last_zombie_time = 0;
    // this._zombie_interval = 5000;
    this._game_over = false;
  }

  public get_grid_position(x: number, y: number) {
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

  public is_grid_position_occupied(row: number, col: number) {
    return this._plants.some(
      (plant) => plant.row() === row && plant.col() === col,
    );
  }

  public add_plant(kind: PlantKind, row: number, col: number) {
    const plant = match(kind)
      .with(PlantKind.Peashooter, () => new Peashooter(row, col, this))
      .with(PlantKind.Sunflower, () => new Sunflower(row, col, this))
      .with(PlantKind.Walnut, () => new Walnut(row, col, this))
      .exhaustive();

    this._plants.push(plant);
    return plant;
  }

  public add_zombie(row: number, kind: ZombieKind) {
    // const zombie = {
    // 	row,
    // 	x: grassWidth + zombieAreaWidth,
    // 	type,
    // 	...zombieTypes[type],
    // 	maxHealth: zombieTypes[type].health,
    // };

    const zombie = match(kind)
      .with(
        P.union(ZombieKind.Basic, ZombieKind.Bucket, ZombieKind.Cone),
        () =>
          new CommonZombieClasses[kind](
            row,
            this._canvas_handler.grass_width() +
              this._canvas_handler.zombie_area_width(),
            this.difficulty,
            this._current_level(),
            this,
          ),
      )
      .exhaustive();

    this._zombies.push(zombie);
    this.update_ui();
    return zombie;
  }

  public shoot_projectile(
    plant: Plant,
    zombie: Zombie,
    kind: ProjectileKind,
    _direction: ProjectileDirection,
  ) {
    // TODO: Implement direction

    const projectile = match(kind)
      .returnType<Projectile>()
      .with(ProjectileKind.pea, () => {
        return new Pea(
          plant.x().value,
          plant.y().value,
          zombie.x().value,
          this._grid.offsetY +
            zombie.row() * this._grid.cellHeight +
            this._grid.cellHeight / 2,
          plant.damage(),
          5,
          this,
        );
      })
      .exhaustive();

    this._projectiles.mutate((p) => p.push(projectile));
  }

  public produce_sun(x: number, y: number) {
    const sun = new Sun(x, y, this);
    sun.target_y().value = y + 100;
    this._suns.mutate((s) => s.push(sun));
    return sun;
  }

  public static UnitializedError() {
    throw new Error("Uninitialized GameState detected");
  }

  public update_ui() {
    document.getElementById("sunCount")!.textContent = this.sun.toString();
    document.getElementById("zombieCount")!.textContent =
      this._zombies.length.toString();
    document.getElementById("waveCount")!.textContent =
      this._wave_count().toString();
    document.getElementById("levelCount")!.textContent =
      this._current_level().toString();
  }
}

export default GameState;
