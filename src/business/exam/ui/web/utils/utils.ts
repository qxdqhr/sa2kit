export function assert(condition: boolean, message: string): asserts condition {
    const err = new Error(`${message}`);
    Promise.reject(err);
  }