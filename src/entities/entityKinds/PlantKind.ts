import { SpriteKeyEnum } from "@/SpriteLoader";
import Peashooter from "../plants/Peashooter";
import Sunflower from "../plants/Sunflower";
import Walnut from "../plants/Walnut";
import { match } from "ts-pattern";

enum PlantKind {
  Peashooter = "pea",
  Sunflower = "sun",
  Walnut = "wal",
}

export const CommonPlantClasses = {
  [PlantKind.Peashooter]: Peashooter,
  [PlantKind.Walnut]: Walnut,
  [PlantKind.Sunflower]: Sunflower,
};

export function SpriteToPlantKind(sprite: SpriteKeyEnum) {
  return match(sprite)
    .with(SpriteKeyEnum.Peashooter, () => PlantKind.Peashooter)
    .with(SpriteKeyEnum.Sunflower, () => PlantKind.Sunflower)
    .with(SpriteKeyEnum.Walnut, () => PlantKind.Walnut)
    .otherwise(() => {
      throw new Error("Sprite not implemented for transference to PlantKind");
    });
}

export default PlantKind;
