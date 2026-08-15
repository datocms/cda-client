import { describe, expect, it } from 'vitest';
import { ApiError, type ApiErrorResponse } from '../ApiError.js';
import { executeQuery } from '../executeQuery.js';

function buildResponse(): ApiErrorResponse {
  return {
    status: 422,
    statusText: 'Unprocessable Entity',
    headers: new Headers(),
    body: { errors: [{ message: 'Invalid ItemId' }] },
  };
}

function buildError() {
  return new ApiError(buildResponse(), '{ allArticles { id } }', {
    token: 'fake-token',
  });
}

describe('ApiError', () => {
  it('keeps a correct prototype chain', () => {
    const error = buildError();

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
    expect(error.constructor.name).toBe('ApiError');
    expect(error.name).toBe('ApiError');
  });

  it('is recognized when thrown by executeQuery', async () => {
    const fetchFn = async () =>
      new Response(
        JSON.stringify({ errors: [{ message: 'Invalid ItemId' }] }),
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: { 'content-type': 'application/json' },
        },
      );

    await expect(
      executeQuery('{ allArticles { id } }', { token: 'fake', fetchFn }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('exposes the response payload', () => {
    const error = buildError();

    expect(error.response.status).toBe(422);
    expect(error.query).toBe('{ allArticles { id } }');
    expect(error.options.token).toBe('fake-token');
  });

  // The package ships parallel CJS and ESM builds, so a bundler can load two
  // distinct copies of this module. `instanceof` must still work for an error
  // produced by the other copy — that is why identity is carried by a
  // registered symbol rather than by the prototype alone.
  it('recognizes an instance coming from a duplicate copy of the module', () => {
    const fromOtherCopy = Object.assign(new Error('Request failed'), {
      name: 'ApiError',
      [Symbol.for('@datocms/cda-client:ApiError')]: true,
    });

    expect(fromOtherCopy).toBeInstanceOf(ApiError);
  });

  it('does not recognize unrelated errors or values', () => {
    expect(new Error('nope')).not.toBeInstanceOf(ApiError);
    expect(new TypeError('nope')).not.toBeInstanceOf(ApiError);
    expect({}).not.toBeInstanceOf(ApiError);
    expect(null).not.toBeInstanceOf(ApiError);
    expect(undefined).not.toBeInstanceOf(ApiError);
    // an error that merely borrows the name is not enough
    expect(
      Object.assign(new Error('impostor'), { name: 'ApiError' }),
    ).not.toBeInstanceOf(ApiError);
  });

  it('keeps subclass checks exact', () => {
    class SubclassedApiError extends ApiError {}

    const parent = buildError();
    const child = new SubclassedApiError(buildResponse(), '{ x }', {
      token: 'fake-token',
    });

    expect(child).toBeInstanceOf(SubclassedApiError);
    expect(child).toBeInstanceOf(ApiError);
    expect(parent).not.toBeInstanceOf(SubclassedApiError);
  });
});
