import type Entity from "../entities/Entity";

class CollisionSystem {
  private _grid: Record<string, Entity[]> = {};

  public async update(entities: Entity[]) {
    this._grid = {};
    const entityMapArray = await Promise.all(
      entities.map(async (entity) => {
        const gridX = Math.floor(entity.x().value / 50);
        const gridY = Math.floor(entity.y().value / 50);
        const key = `${gridX},${gridY}`;

        return [key, entity] as const;
      }),
    );

    this._grid = entityMapArray.reduce(
      (acc: Record<string, Entity[]>, [key, entity]) => {
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(entity);
        return acc;
      },
      {},
    );
  }

  public get_nearby(x: number, y: number, radius: number, gridRadius = 1) {
    const gridX = Math.floor(x / 50);
    const gridY = Math.floor(y / 50);

    const range = (n: number) =>
      Array.from({ length: n * 2 + 1 }, (_, i) => i - n);

    const range_of_grid_radius = range(gridRadius);

    const results = range_of_grid_radius.flatMap((dx) =>
      range_of_grid_radius.flatMap((dy) => {
        const cell = this._grid[`${gridX + dx},${gridY + dy}`];
        return cell ?? [];
      }),
    );

    return results.filter((entity) => {
      const dx = entity.x().value - x;
      const dy = entity.y().value - y;
      return Math.hypot(dx, dy) <= radius;
    });
  }
}

export default CollisionSystem;
