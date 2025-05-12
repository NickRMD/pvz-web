const spriteKeys = [
	"sunflower",
	"peashooter",
	"peashooter2",
	"peashooter3",
	"walnut",
	"zombie",
	"projectile",
	"sun",
	"zombieCone",
	"zombieBucket",
] as const;
type SpriteKey = (typeof spriteKeys)[number];
interface Sprites extends Record<SpriteKey, HTMLImageElement> {}

class SpriteLoader {
	private _sprites?: Sprites;
	private _loaded = false;

	constructor() {}

	public async load() {
		const sprites: Sprites = {} as Sprites;
		for (const key of spriteKeys) {
			sprites[key] = new Image();
		}

		sprites.sunflower.src = "assets/sunflower.webp";
		sprites.peashooter.src = "assets/peashooter.webp";
		sprites.sun.src = "/assets/sun.webp";
		sprites.projectile.src = "/assets/pea.webp";
		sprites.peashooter2.src = "/assets/pea.webp";
		sprites.peashooter3.src = "/assets/pea.webp";
		sprites.walnut.src = "/assets/wallnut.webp";
		sprites.zombie.src = "/assets/zombie_basic.webp";
		sprites.zombieCone.src = "/assets/zombie_cone.webp";
		sprites.zombieBucket.src = "/assets/zombie_buckethead.webp";

		this._loaded = true;
		this._sprites = sprites;
	}

	public is_loaded(): Readonly<boolean> {
		return this._loaded;
	}

	public sprites(): Readonly<Sprites> {
		if (!this._sprites) throw Error("Sprites aren't initialized yet!");
		return this._sprites;
	}
}

export default SpriteLoader;
