import { match, P } from "ts-pattern";
import ZombieKind, {
  CommonZombieClasses,
} from "./entities/entityKinds/ZombieKind";
import Plant from "./entities/Plant";
import Sunflower from "./entities/plants/Sunflower";
import Projectile from "./entities/Projectile";
import Pea from "./entities/projectiles/Pea";
import Sun from "./entities/Sun";
import Zombie from "./entities/Zombie";
import PlantKind from "./entities/entityKinds/PlantKind";
import Peashooter from "./entities/plants/Peashooter";
import Walnut from "./entities/plants/Walnut";
import Signal from "./utils/Signal";
import Difficulty from "./entities/Difficulty";
import type CanvasHandler from "./CanvasHandler";
import type SpriteLoader from "./SpriteLoader";
import ProjectileKind from "./entities/entityKinds/ProjectileKind";
import type { ProjectileDirection } from "./entities/entityKinds/ProjectileKind";
import type Entity from "./entities/Entity";

interface PlantSelection {
  kind: PlantKind;
  cost: number;
  html_element: HTMLElement;
}

class GameState {
  public sun = 50;
  private _entities: Signal<Entity[]> = new Signal([] as Entity[]);
  // private _last_zombie_time = 0;
  // private _zombie_interval = 5000;
  public readonly sun_interval = 5000;
  public last_sun_time = 0;
  private _grid = {
    rows: 5,
    cols: 9,
    cell_width: 0,
    cell_height: 0,
    offset_x: 0,
    offset_y: 0,
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
    this._grid.cell_height = this._canvas_handler.canvas().height / 5;
    this._grid.cell_width = this._canvas_handler.grass_width() / 9;
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

  public entities() {
    return this._entities;
  }
  
  public remove_entities(predicate: (e: Entity) => boolean) {
    for (let i = 0; i < this._entities.value.length; ) {
      if (predicate(this._entities.value[i])) {
        this._entities.mutate(e => e.splice(i, 1));
      } else {
        i++;
      }
    }
  }

  public projectiles() {
    return this._entities.value.filter(e => e instanceof Projectile);
  }

  public suns() {
    return this._entities.value.filter(e => e instanceof Sun)
  }

  public zombies(): Readonly<Zombie[]> {
    return this._entities.value.filter(e => e instanceof Zombie)
  }

  public mut_zombies() {
    return this._entities.value.filter(e => e instanceof Zombie)
  }

  public plants(): Readonly<Plant[]> {
    return this._entities.value.filter(e => e instanceof Plant)
  }

  public mut_plants() {
    return this._entities.value.filter(e => e instanceof Plant)
  }

  public grid(): Readonly<typeof this._grid> {
    return this._grid;
  }

  reset() {
    this.sun = 50;
    this._entities.value = [];
    // this._last_zombie_time = 0;
    // this._zombie_interval = 5000;
    this._game_over = false;
  }

  public get_grid_position(x: number, y: number) {
    const col = Math.floor((x - this._grid.offset_x) / this._grid.cell_width);
    const row = Math.floor((y - this._grid.offset_y) / this._grid.cell_height);

    if (
      row >= 0 &&
      row < this._grid.rows &&
      col >= 0 &&
      col < this._grid.cols
    ) {
      return {
        row,
        col,
        x: this._grid.offset_x + col * this._grid.cell_width,
        y: this._grid.offset_y + row * this._grid.cell_height,
      };
    }
    return null;
  }

  public is_grid_position_occupied(row: number, col: number) {
    return this.plants().some(
      (plant) => plant.row() === row && plant.col() === col,
    );
  }

  public add_plant(kind: PlantKind, row: number, col: number) {
    const plant = match(kind)
      .with(PlantKind.Peashooter, () => new Peashooter(row, col, this))
      .with(PlantKind.Sunflower, () => new Sunflower(row, col, this))
      .with(PlantKind.Walnut, () => new Walnut(row, col, this))
      .exhaustive();

    this._entities.mutate(e => e.push(plant));
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

    this._entities.mutate(e => e.push(zombie));
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
          this._grid.offset_y +
            zombie.row() * this._grid.cell_height +
            this._grid.cell_height / 2,
          plant.damage(),
          5,
          this,
        );
      })
      .exhaustive();

    this._entities.mutate(p => p.push(projectile));
  }

  public produce_sun(x: number, y: number) {
    const sun = new Sun(x, y, this);
    sun.target_y().value = y + 100;
    this._entities.mutate(s => s.push(sun));
    return sun;
  }

  public static UnitializedError() {
    throw new Error("Uninitialized GameState detected");
  }

  public update_ui() {
    document.getElementById("sunCount")!.textContent = this.sun.toString();
    document.getElementById("zombieCount")!.textContent =
      this.zombies().length.toString();
    document.getElementById("waveCount")!.textContent =
      this._wave_count().toString();
    document.getElementById("levelCount")!.textContent =
      this._current_level().toString();
  }
}

export default GameState;
