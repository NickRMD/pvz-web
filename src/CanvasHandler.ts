class CanvasHandler {
  private _canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
  private _ctx = this._canvas.getContext("2d") as CanvasRenderingContext2D;
  private _grass_width = this._canvas.width * 0.8;
  private _zombie_area_width = this._canvas.width * 0.2;

  constructor() {
    this._canvas_resize();
    window.addEventListener("resize", this._canvas_resize.bind(this));
  }

  private _canvas_resize() {
    const scale = window.devicePixelRatio || 1;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    this._canvas.style.width = `${windowWidth}px`;
    this._canvas.style.height = `${windowHeight}px`;

    this._canvas.width = windowWidth * scale;
    this._canvas.height = windowHeight * scale;

    this._ctx.setTransform(1, 0, 0, 1, 0, 0);

    this._ctx.scale(scale, scale);

    this._grass_width = windowWidth * 0.8;
    this._zombie_area_width = windowWidth * 0.2;

    this._ctx.imageSmoothingEnabled = true;
    this._ctx.imageSmoothingQuality = "high";

    this.draw_background();
  }

  public canvas(): Readonly<typeof this._canvas> {
    return this._canvas;
  }

  public ctx(): Readonly<typeof this._ctx> {
    return this._ctx;
  }

  public mut_ctx() {
    return this._ctx;
  }

  public mut_canvas() {
    return this._canvas;
  }

  public grass_width(): Readonly<number> {
    return this._grass_width;
  }

  public zombie_area_width(): Readonly<number> {
    return this._zombie_area_width;
  }

  public draw_background() {
    this._ctx.fillStyle = "#7CFC0000";
    this._ctx.fillRect(0, 0, this._grass_width, this._canvas.height);

    this._ctx.fillStyle = "#7CFC0000";
    this._ctx.fillRect(
      this._grass_width,
      0,
      this._zombie_area_width,
      this._canvas.height,
    );
  }
}

export default CanvasHandler;
