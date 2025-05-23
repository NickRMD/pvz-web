import deep_freeze from "./deep_freeze";

type Subscriber<T> = (value: T) => void;

export default class Signal<T> {
  private _value: T;
  private _subscribers: Set<Subscriber<T>> = new Set();

  constructor(initial_value: T) {
    this._value = initial_value;
  }

  get value(): Readonly<T> {
    return deep_freeze(this._value);
  }

  set value(new_value: T) {
    if (this._value !== new_value) {
      this._value = new_value;
      this._notify();
    }
  }

  public mutate(mutator: (val: T) => void) {
    mutator(this._value);
    this._notify();
  }

  public subscribe(callback: Subscriber<T>): () => void {
    this._subscribers.add(callback);
    callback(this._value);

    return () => this._subscribers.delete(callback);
  }

  public unlisten_all() {
    this._subscribers.clear();
  }

  private _notify() {
    for(const callback of this._subscribers) {
      callback(this._value);
    }
  }
}
