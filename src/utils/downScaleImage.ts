function resample_single(
  canvas: HTMLCanvasElement,
  width_input: number,
  height_input: number,
  resize_canvas: boolean
): void {
  const width_source = canvas.width;
  const height_source = canvas.height;
  const width = Math.round(width_input);
  const height = Math.round(height_input);

  const ratio_w = width_source / width;
  const ratio_h = height_source / height;
  const ratio_w_half = Math.ceil(ratio_w / 2);
  const ratio_h_half = Math.ceil(ratio_h / 2);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D context not available");
  }
  
  const img = ctx.getImageData(0, 0, width_source, height_source);
  const img2 = ctx.createImageData(width, height);
  const data = img.data;
  const data2 = img2.data;

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x2 = (i + j * width) * 4;
      let weight = 0;
      let weights = 0;
      let weights_alpha = 0;
      let gx_r = 0;
      let gx_g = 0;
      let gx_b = 0;
      let gx_a = 0;
      const center_y = (j + 0.5) * ratio_h;
      const yy_start = Math.floor(j * ratio_h);
      const yy_stop = Math.ceil((j + 1) * ratio_h);

      for (let yy = yy_start; yy < yy_stop; yy++) {
        const dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
        const center_x = (i + 0.5) * ratio_w;
        const w0 = dy * dy;
        const xx_start = Math.floor(i * ratio_w);
        const xx_stop = Math.ceil((i + 1) * ratio_w);

        for (let xx = xx_start; xx < xx_stop; xx++) {
          const dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
          const w = Math.sqrt(w0 + dx * dx);

          if (w >= 1) continue;

          // Hermite filter
          weight = 2 * w * w * w - 3 * w * w + 1;
          const pos_x = 4 * (xx + yy * width_source);

          // alpha channel
          gx_a += weight * data[pos_x + 3];
          weights_alpha += weight;

          // colors, adjust weight if alpha < 255
          const alpha = data[pos_x + 3];
          if (alpha < 255) weight *= alpha / 250;

          gx_r += weight * data[pos_x];
          gx_g += weight * data[pos_x + 1];
          gx_b += weight * data[pos_x + 2];
          weights += weight;
        }
      }

      data2[x2] = gx_r / weights;
      data2[x2 + 1] = gx_g / weights;
      data2[x2 + 2] = gx_b / weights;
      data2[x2 + 3] = gx_a / weights_alpha;
    }
  }

  if (resize_canvas) {
    canvas.width = width;
    canvas.height = height;
  } else {
    ctx.clearRect(0, 0, width_source, height_source);
  }

  ctx.putImageData(img2, 0, 0);
}


export default function down_scale_image(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const imgCV = document.createElement('canvas');
  imgCV.width = img.width;
  imgCV.height = img.height;

  const imgCtx = imgCV.getContext('2d');
  if (!imgCtx) throw new Error("2D context not available");

  imgCtx.drawImage(img, 0, 0);

  // Call resample_single with explicit width and height, resize_canvas = true
  resample_single(imgCV, targetWidth, targetHeight, true);

  return imgCV;
}


export function down_scale_sprite(
  sprite: HTMLImageElement,
  entity_width: number,
  entity_height: number
): HTMLCanvasElement {
  const aspectRatio = sprite.width / sprite.height;
  const width = entity_width;
  const height = entity_height / aspectRatio;

  return down_scale_image(sprite, width, height);
}
