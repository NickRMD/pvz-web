import Plant from "../Plant";

export default class Sunflower extends Plant {
	update(timestamp) {
		if (timestamp - this.lastActionTime > this.sunProductionTime) {
			produceSun(this.x, this.y);
			this.lastActionTime = timestamp;
		}
	}
}
