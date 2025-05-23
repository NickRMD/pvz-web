function deep_freeze<T>(obj: T): T {
  // Retrieve property names defined on obj
  const propNames = Object.getOwnPropertyNames(obj);

  // Freeze properties before freezing self
  for (const name of propNames) {
    // biome-ignore lint/suspicious/noExplicitAny:
    const value = (obj as any)[name];

    if (
      value && typeof value === "object" &&
      !Object.isFrozen(value)
    ) {
      deep_freeze(value);
    }
  }

  return Object.freeze(obj);
}

export default deep_freeze;
