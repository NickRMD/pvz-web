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

type SpriteKey = `${SpriteKeyEnum}`;
export interface Sprites extends Record<SpriteKey, HTMLImageElement> {}

export default class SpriteLoader {
  private _sprites?: Sprites;
  private _loaded = false;

  public async load() {
    const spriteKeys = Object.values(SpriteKeyEnum);
    const spritesArray = await Promise.all(
      spriteKeys.map(async (key) => {
        const img = new Image();
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

  public static isSprite(value: string): SpriteKeyEnum {
    if (Object.values(SpriteKeyEnum).includes(value as SpriteKeyEnum)) {
      return value as SpriteKeyEnum;
    }
    throw new Error("Value is not a valid Sprite");
  }

  public is_loaded(): Readonly<boolean> {
    return this._loaded;
  }

  public sprites(): Readonly<Sprites> {
    if (!this._sprites) throw Error("Sprites aren't initialized yet!");
    return this._sprites;
  }
}
