import ZombieBasic from "../zombies/Basic";
import ZombieBucket from "../zombies/Bucket";
import ZombieCone from "../zombies/Cone";

enum ZombieKind {
  Basic = "ba",
  Bucket = "bu",
  Cone = "co",
}

export const CommonZombieClasses = {
  [ZombieKind.Basic]: ZombieBasic,
  [ZombieKind.Bucket]: ZombieBucket,
  [ZombieKind.Cone]: ZombieCone,
};

export default ZombieKind;
