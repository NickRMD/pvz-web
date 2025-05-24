type AsyncSubscriber<T> = (value: T) => Promise<void> | void;

export default class AsyncSignal<T> {
  private _value: T;
  private _subscribers: Set<AsyncSubscriber<T>> = new Set();

  constructor(initial_value: T) {
    this._value = initial_value;
  }

  get value(): Readonly<T> {
    return this._value;
  }

  set value(new_value: T) {
    if (this._value !== new_value) {
      this._value = new_value;
      void this._notify();
    }
  }

  public mutate(mutator: (val: T) => void) {
    mutator(this._value);
    void this._notify();
  }

  public subscribe(callback: AsyncSubscriber<T>): () => void {
    this._subscribers.add(callback);
    void callback(this._value);

    return () => this._subscribers.delete(callback);
  }

  public unlisten_all() {
    this._subscribers.clear();
  }

  private async _notify() {
    await Promise.all(
      Array.from(this._subscribers).map((sub) => sub(this._value)),
    );
  }
}
