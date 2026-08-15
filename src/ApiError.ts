import type { BuildRequestHeadersOptions } from './buildRequestHeaders.js';

export type ApiErrorResponse = {
  status: number;
  statusText: string;
  headers: Headers;
  body?: unknown;
};

/**
 * Brand stamped on every `ApiError` instance.
 *
 * `Symbol.for()` looks up the cross-realm global symbol registry, so every
 * copy of this module — CJS or ESM, inlined by a bundler or not — resolves it
 * to the very same symbol. That is what lets `instanceof` keep working when
 * more than one copy of the package ends up loaded.
 */
const API_ERROR = Symbol.for('@datocms/cda-client:ApiError');

export class ApiError extends Error {
  public query: string;
  public options: BuildRequestHeadersOptions;
  public response: ApiErrorResponse;

  declare readonly [API_ERROR]: true;

  /**
   * Makes `error instanceof ApiError` structural rather than identity-based.
   *
   * This package ships parallel CJS and ESM builds, so a bundler can load two
   * distinct copies of this module and therefore two distinct `ApiError`
   * classes. A plain prototype check would silently return `false` for an
   * error thrown by the other copy; checking the shared brand does not.
   */
  static [Symbol.hasInstance](value: unknown): value is ApiError {
    if (typeof value !== 'object' || value === null || !(API_ERROR in value)) {
      return false;
    }

    // `this` is the constructor `instanceof` was invoked on, which is not
    // necessarily `ApiError` itself: when it is a subclass, defer to a real
    // prototype-chain check so subclasses stay exact. Each copy of this module
    // closes over its own `ApiError`, so this comparison still holds when
    // checking against a duplicated copy.
    // biome-ignore lint/complexity/noThisInStatic: dynamic `this` is required here; hardcoding `ApiError` would break subclass checks
    const invokedOn = this as unknown as { prototype: object };

    if (invokedOn !== ApiError) {
      return Object.prototype.isPrototypeOf.call(invokedOn.prototype, value);
    }

    return true;
  }

  constructor(
    response: ApiErrorResponse,
    query: string,
    options: BuildRequestHeadersOptions,
  ) {
    const completeStatus = `status ${response.status} (${response.statusText})`;
    const serializedBody =
      typeof response.body === 'string'
        ? response.body
        : JSON.stringify(response.body);

    super(
      response.status < 200 || response.status >= 300
        ? `Request failed with ${completeStatus}: ${serializedBody}`
        : `Request failed: ${serializedBody}`,
    );

    // Restores the prototype chain when this class is transpiled down to a
    // target that emits `Error.call(this)`: that call ignores `this` and
    // returns a fresh Error, which would otherwise become the instance and
    // make `instanceof ApiError` false.
    Object.setPrototypeOf(this, new.target.prototype);

    Object.defineProperty(this, API_ERROR, {
      value: true,
      enumerable: false,
      writable: false,
      configurable: false,
    });

    this.name = 'ApiError';
    this.response = response;
    this.query = query;
    this.options = options;
  }
}
