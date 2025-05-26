import CanvasHandler from "./CanvasHandler";
import { SpriteToPlantKind } from "./entities/entityKinds/PlantKind.ts";
import Sun from "./entities/Sun";
import GameState from "./GameState.ts";
import CollisionSystem from "./gameSystems/CollisionSystem";
import WaveSystem from "./gameSystems/WaveSystem";
import SpriteLoader from "./SpriteLoader";

class Game {
  private _sprite_loader = new SpriteLoader();
  private _canvas_handler = new CanvasHandler();
  private _game_state: GameState;
  private _collision_system = new CollisionSystem();
  private _wave_system: WaveSystem;

  constructor() {
    this._game_state = new GameState(this._sprite_loader, this._canvas_handler);
    this._wave_system = new WaveSystem(
      this._game_state.rows.bind(this._game_state),
      this._game_state.add_zombie.bind(this._game_state),
    );
    this._game_state.initialize(
      this._wave_system.current_wave.bind(this._wave_system),
      this._wave_system.level.bind(this._wave_system),
    );
  }

  public error_pause() {
    if (!this._game_state.is_paused() && this._sprite_loader.is_loaded()) {
      console.error("An error ocurred, game paused");
      this._game_state.toggle_pause();
      document.getElementById("pauseMenu")!.style.display =
        this._game_state.is_paused() ? "flex" : "none";
    }
  }

  public async start() {
    const loading_sprites = this._sprite_loader.load();
    this._game_state.update_ui();
    this._draw_grid();
    this._setup_listeners();
    await loading_sprites;
    if (this._sprite_loader.is_loaded()) {
      document.getElementById("loading")!.style.display = "none";
      this._game_state.update_ui();
      // playStartSound();
      requestAnimationFrame(this._game_loop.bind(this));
    } else {
      throw new Error("There was an error loading sprites!");
    }
  }

  private _game_loop(timestamp: number) {
    if (this._game_state.is_game_over()) return;
    if (this._game_state.is_paused()) {
      requestAnimationFrame(this._game_loop.bind(this));
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
      ...this._game_state.zombies(),
      ...this._game_state.plants(),
    ]);
    this._wave_system.update(
      timestamp,
      this._game_state.is_game_over(),
      this._game_state.is_paused(),
    );

    this._draw_grid();

    for (const plant of this._game_state.plants()) {
      plant.update(timestamp);
      plant.draw(this._canvas_handler.ctx());
    }

    this._game_state.projectiles().value = this._game_state
      .projectiles()
      .value.filter((proj) => {
        proj.update();
        proj.draw(this._canvas_handler.ctx());
        return !proj.reached();
      });

    for (const zombie of this._game_state.mut_zombies()) {
      zombie.x().value -= zombie.speed;

      const gridPos = this._game_state.get_grid_position(
        zombie.x().value,
        this._game_state.grid().offset_y +
          zombie.row() * this._game_state.grid().cell_height,
      );
      if (gridPos) {
        const plant = this._game_state
          .plants()
          .find((p) => p.row() === gridPos.row && p.col() === gridPos.col);
        if (!plant) {
          zombie.speed = 0.5;
        }
        if (plant) {
          zombie.speed = 0;
          plant.health().value -= zombie.damage().value;
          if (plant.health().value <= 0) {
            this._game_state
              .mut_plants()
              .splice(this._game_state.plants().indexOf(plant), 1);
            zombie.speed = 0.5;
          }
        }
      }

      if (zombie.x().value < this._game_state.grid().offset_x) {
        this._game_over();
        return;
      }
    }

    for (const zombie of this._game_state.zombies()) {
      zombie.draw(this._canvas_handler.ctx());
    }

    if (this._game_state.suns().value) {
      this._game_state.suns().value = this._game_state
        .suns()
        .value.filter((sun) => {
          sun.update();
          sun.draw(this._canvas_handler.ctx());
          return !sun.collected();
        });
    }

    if (
      timestamp - this._game_state.last_sun_time >
      this._game_state.sun_interval
    ) {
      // generateRandomSun();
      this._generate_random_sun();
      this._game_state.last_sun_time = timestamp;
    }

    requestAnimationFrame(this._game_loop.bind(this));
  }

  private _setup_listeners() {
    for (const icon of document.querySelectorAll(".plant-icon")) {
      icon.addEventListener("click", (evt) => {
        const e = evt as MouseEvent;
        if (this._game_state.is_game_over() || this._game_state.is_paused())
          return;

        const current_target = e.currentTarget as HTMLElement;
        const plant_type = SpriteLoader.isSprite(
          current_target.getAttribute("data-plant") as string,
        );
        const cost = Number.parseInt(
          current_target.getAttribute("data-cost") as string,
        );

        if (this._game_state.sun >= cost) {
          this._game_state.dragging_plant = {
            kind: SpriteToPlantKind(plant_type),
            cost: cost,
            html_element: current_target,
          };
          current_target.style.opacity = "0.5";

          const preview = document.getElementById(
            "plantPreview",
          ) as HTMLElement;
          preview.style.display = "block";
          preview.style.backgroundImage = `url('${this._sprite_loader.sprites()[plant_type].src}')`;

          preview.style.left = `${e.clientX - 25}px`;
          preview.style.top = `${e.clientY - 25}px`;
        }
      });
    }

    document
      .getElementById("testErrorButton")!
      .addEventListener("click", () => {
        throw new Error("Test error");
      });

    document.addEventListener("mousemove", (e) => {
      if (this._game_state.dragging_plant) {
        const preview = document.getElementById("plantPreview") as HTMLElement;
        preview.style.left = `${e.clientX - 25}px`;
        preview.style.top = `${e.clientY - 25}px`;
      }
    });

    document.addEventListener("mouseup", (e) => {
      const preview = document.getElementById("plantPreview") as HTMLElement;
      preview.style.display = "none";

      if (this._game_state.dragging_plant) {
        this._game_state.dragging_plant.html_element.style.opacity = "1";

        const gridPos = this._game_state.get_grid_position(
          e.clientX,
          e.clientY,
        );
        if (
          gridPos &&
          !this._game_state.is_grid_position_occupied(gridPos.row, gridPos.col)
        ) {
          this._game_state.sun -= this._game_state.dragging_plant.cost;
          if (this._game_state.dragging_plant) {
            this._game_state.add_plant(
              this._game_state.dragging_plant.kind,
              gridPos.row,
              gridPos.col,
            );
          }
          this._game_state.update_ui();
        }

        this._game_state.dragging_plant = null;
      }
    });

    this._canvas_handler.mut_canvas().addEventListener("click", (e) => {
      if (this._game_state.is_game_over() || this._game_state.is_paused())
        return;

      if (this._game_state.suns) {
        const rect = this._canvas_handler.canvas().getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        for (let i = this._game_state.suns().value.length - 1; i >= 0; i--) {
          const sun = this._game_state.suns().value[i];
          const distance = Math.sqrt(
            (clickX - sun.x().value) ** 2 + (clickY - sun.y().value) ** 2,
          );

          if (distance < 30 && !sun.collected()) {
            sun.collect();
            this._game_state.sun += sun.value();
            this._game_state.update_ui();

            const sunEffect = document.createElement("div");
            sunEffect.className = "sun-effect";
            sunEffect.style.left = `${clickX - 15}px`;
            sunEffect.style.top = `${clickY - 15}px`;
            document.body.appendChild(sunEffect);

            setTimeout(() => {
              document.body.removeChild(sunEffect);
            }, 1000);

            this._game_state.suns().mutate((s) => s.splice(i, 1));
            break;
          }
        }
      }
    });

    document.getElementById("resumeButton")!.addEventListener("click", () => {
      this._game_state.toggle_pause();
      document.getElementById("pauseMenu")!.style.display =
        this._game_state.is_paused() ? "flex" : "none";
    });

    document.getElementById("restartButton")!.addEventListener("click", () => {
      this._game_state.toggle_pause();
      document.getElementById("pauseMenu")!.style.display =
        this._game_state.is_paused() ? "flex" : "none";
      this._game_over();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this._game_state.toggle_pause();
        document.getElementById("pauseMenu")!.style.display =
          this._game_state.is_paused() ? "flex" : "none";
      }

      // // Sistema de fusão de plantas (tecla M) a fazer
      // if (
      // 	e.key === "m" &&
      // 	!this._game_state.is_paused() &&
      // 	!this._game_state.is_game_over()
      // ) {
      // 	document.getElementById("mergeArea").style.display = "flex";
      // }

      // if (e.key === "Enter" && this._game_state.mergePlants.length === 2) {
      // 	mergePlants();
      // }

      if (e.key === "1") {
      }

      // if (e.key === "1") {
      //   const plant = this._game_state.plants()[0];
      //   const cost = plant.cost;
      //
      //   if (this._game_state.sun >= cost) {
      //     this._game_state.dragging_plant = {
      //       kind: plant.kind,
      //       cost: cost,
      //       html_element: document.querySelector(
      //         `[data-plant="${plant.kind}"]`,
      //       ) as HTMLElement,
      //     };
      //     this._game_state.dragging_plant.html_element.style.opacity = "0.5";
      //     document.getElementById("mergeArea")!.style.display = "none";
      //   }
      // } else if (e.key === "2") {
      //   // this._game_state.mergePlants.push(this._game_state.plants()[1]);
      //   document.getElementById("mergeArea")!.style.display = "none";
      // }
    });

    // document.addEventListener("keyup", (e) => {
    // 	if (e.key === "m") {
    // 		mergePlants();
    // 	}
    // });
  }

  private _draw_grid() {
    const { rows, cols, cell_width, cell_height, offset_x, offset_y } =
      this._game_state.grid();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offset_x + col * cell_width;
        const y = offset_y + row * cell_height;

        this._canvas_handler.mut_ctx().fillStyle =
          (row + col) % 2 === 0 ? "#8ed04b" : "#7fbf3b";
        this._canvas_handler.ctx().fillRect(x, y, cell_width, cell_height);
      }
    }
  }

  private _generate_random_sun(): Sun {
    const sun = new Sun(
      Math.random() * (this._canvas_handler.canvas().width - 100) + 50,
      0,
      this._game_state,
    );
    sun.target_y().value =
      Math.random() * (this._canvas_handler.canvas().height - 200) + 100;
    this._game_state.suns().mutate((s) => s.push(sun));
    return sun;
  }

  private _game_over() {
    this._game_state.game_over();

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
        `Você sobreviveu a ${this._wave_system.current_wave()} waves`,
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
          this._reset_game();
      },
      { once: true },
    );
  }

  private _reset_game() {
    this._game_state.reset();
    this._wave_system.reset();

    this._game_state.update_ui();
    requestAnimationFrame(this._game_loop.bind(this));
  }
}

export default Game;
