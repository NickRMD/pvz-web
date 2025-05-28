

class FPSCounter {
  private _fps = 0;
  private _frame_time = 16.7;
  private _frame_times: number[] = [];
  private _max_samples = 90;

  public update_fps(delta_s: number) {
    const delta = delta_s * 1000;
    this._frame_times.push(Math.max(delta, 0.1));
    if (this._frame_times.length > this._max_samples) this._frame_times.shift();

    const avg_delta = this._frame_times.reduce((a, b) => a + b, 0) / this._frame_times.length;
    this._frame_time = Math.trunc(avg_delta * 100) / 100;
    this._fps = Math.round((1000 / avg_delta) * 10) / 10;
  }

  public draw_fps(ctx: CanvasRenderingContext2D, is_paused = false) {
    if(is_paused) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(10, 120, 200, 60)
    }
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`FPS: ${this._fps}`, 20, 140);
    ctx.fillText(`Frametime: ${this._frame_time}`, 20, 170);
  }
}

export default FPSCounter;
