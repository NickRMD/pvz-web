const zombieTypes = {
	basic: {
		health: 100,
		speed: 0.5,
		damage: 0.5,
		sprite: sprites.zombie,
		color: "#607D8B",
		width: 40,
		height: 80,
	},
	cone: {
		health: 200,
		speed: 0.4,
		damage: 0.5,
		sprite: sprites.zombieCone,
		color: "#FF9800",
		width: 45,
		height: 85,
	},
	bucket: {
		health: 300,
		speed: 0.3,
		damage: 1,
		sprite: sprites.zombieBucket,
		color: "#9E9E9E",
		width: 50,
		height: 90,
	},
};

enum ZombieType {
	basic = 0,
	cone,
	bucket,
}

export default zombieTypes as Readonly<typeof zombieTypes>;
export { ZombieType };
