import type { BuildRequestHeadersOptions } from './buildRequestHeaders';

export type ApiErrorResponse = {
  status: number;
  statusText: string;
  headers: Headers;
  body?: unknown;
};

export class ApiError extends Error {
  public query: string;
  public options: BuildRequestHeadersOptions;
  public response: ApiErrorResponse;

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

    this.name = 'ApiError';
    this.response = response;
    this.query = query;
    this.options = options;
  }
}
