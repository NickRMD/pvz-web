export enum SpriteKeyEnum {
  Sunflower = "sunflower",
  Peashooter = "peashooter",
  Pea = "pea",
  Walnut = "walnut",
  Sun = "sun",
  ZombieBasic = "zombie_basic",
  ZombieCone = "zombie_cone",
  ZombieBucket = "zombie_bucket",
}

declare global {
  interface Window {
    _sprite_loader: SpriteLoader;
  }
}

type SpriteKey = `${SpriteKeyEnum}`;
export interface Sprites extends Record<SpriteKey, HTMLImageElement> {}
export interface SpriteCache
  extends Partial<Record<SpriteKey, HTMLCanvasElement>> {}

export default class SpriteLoader {
  private _sprites?: Sprites;
  private _sprite_cache: SpriteCache = {};
  private _loaded = false;

  constructor() {
    if (import.meta.env.DEV) {
      window._sprite_loader = this;
    }
  }

  public async load() {
    const spriteKeys = Object.values(SpriteKeyEnum);
    const spritesArray = await Promise.all(
      spriteKeys.map(async (key) => {
        const img = new Image();

        // Used so the image doesn't flicker when loaded
        img.style.display = "none";

        const { default: url } = await import(`#/sprites/${key}.webp`);
        img.src = url;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () =>
            reject(new Error(`Failed to load sprite ${key} at ${url}`));
        });
        return [key, img] as const;
      }),
    );

    const sprites: Sprites = Object.fromEntries(spritesArray) as Sprites;

    this._loaded = true;
    this._sprites = sprites;
  }

  public set_sprite(sprite_key: SpriteKeyEnum, new_image: HTMLCanvasElement) {
    if (!this._sprites) throw Error("Sprites aren't initialized yet!");
    console.log(`${sprite_key} cached!`);
    this._sprite_cache[sprite_key] = new_image;
  }

  public static isSprite(value: string): SpriteKeyEnum {
    if (Object.values(SpriteKeyEnum).includes(value as SpriteKeyEnum)) {
      return value as SpriteKeyEnum;
    }
    throw new Error("Value is not a valid Sprite");
  }

  public is_loaded(): Readonly<boolean> {
    return this._loaded;
  }

  public cached_sprites(): Readonly<SpriteCache> {
    return this._sprite_cache;
  }

  public sprites(): Readonly<Sprites> {
    if (!this._sprites) throw Error("Sprites aren't initialized yet!");
    return this._sprites;
  }
}
