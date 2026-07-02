if (typeof global.DOMException === 'undefined') {
  class DOMException extends Error {
    constructor(message?: string, name?: string) {
      super(message);
      this.name = name || 'DOMException';
      Object.setPrototypeOf(this, DOMException.prototype);
    }
  }

  (global as any).DOMException = DOMException;
}
