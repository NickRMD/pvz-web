import Pea from "../projectiles/Pea";

enum ProjectileKind {
  pea = "pe",
}

export const CommonPlantClasses = {
  [ProjectileKind.pea]: Pea,
};

export enum ProjectileDirection {
  ZombieToPlant = "Z2P",
  PlantToZombie = "P2Z",
}

export default ProjectileKind;
