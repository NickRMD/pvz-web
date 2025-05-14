class Entity {
	protected _x = 0;
	protected _y = 0;
	protected _height = 0;
	protected _width = 0;

  public x(): Readonly<number> {
    return this._x;
  }

  public y(): Readonly<number> {
    return this._y;
  }
}

export default Entity;
