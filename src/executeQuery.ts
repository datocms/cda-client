import type * as GraphQLWeb from '@0no-co/graphql.web';
import { print } from '@0no-co/graphql.web';
import { ApiError } from './ApiError';
import type { BuildRequestHeadersOptions } from './buildRequestHeaders';
import { buildRequestInit } from './buildRequestInit';

/** A GraphQL `DocumentNode` with attached generics for its result data and variables.
 *
 * @remarks
 * A GraphQL {@link DocumentNode} defines both the variables it accepts on request and the `data`
 * shape it delivers on a response in the GraphQL query language.
 *
 * To bridge the gap to TypeScript, tools may be used to generate TypeScript types that define the shape
 * of `data` and `variables` ahead of time. These types are then attached to GraphQL documents using this
 * `TypedDocumentNode` type.
 *
 * Using a `DocumentNode` that is typed like this will cause any `urql` API to type its input `variables`
 * and resulting `data` using the types provided.
 *
 * @privateRemarks
 * For compatibility reasons this type has been copied and internalized from:
 * https://github.com/dotansimha/graphql-typed-document-node/blob/3711b12/packages/core/src/index.ts#L3-L10
 *
 * @see {@link https://github.com/dotansimha/graphql-typed-document-node} for more information.
 */

export type TypedDocumentNode<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Result = { [key: string]: any },
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  Variables = { [key: string]: any },
> = GraphQLWeb.DocumentNode & {
  /** Type to support `@graphql-typed-document-node/core`
   * @internal
   */
  __apiType?: (variables: Variables) => Result;
  /** Type to support `TypedQueryDocumentNode` from `graphql`
   * @internal
   */
  __ensureTypesOfVariablesAndResultMatching?: (variables: Variables) => Result;
};

export type ExecuteQueryOptions<Variables = unknown> =
  BuildRequestHeadersOptions & {
    /** The variables to be sent with the query */
    variables?: Variables;
    /** A fetch function to be used instead of the default `fetch` */
    fetchFn?: typeof fetch;
    /** Whether to automatically retry the query in case of encountering rate limits with 429 error codes (defaults to true) */
    autoRetry?: boolean;
  };

export type RawExecuteQueryOptions<Variables = unknown> =
  ExecuteQueryOptions<Variables> & { retryCount?: number };

/**
 * Executes a GraphQL query using the DatoCMS Content Delivery API, returning
 * both the result of the query as well as the full response object from the
 * server.
 */
export function rawExecuteQuery<Result = unknown, Variables = unknown>(
  query: TypedDocumentNode<Result, Variables>,
  options: ExecuteQueryOptions<Variables>,
): Promise<[Result, Response]>;

export function rawExecuteQuery<Result = unknown, Variables = unknown>(
  query: GraphQLWeb.DocumentNode,
  options: ExecuteQueryOptions<Variables>,
): Promise<[Result, Response]>;

export function rawExecuteQuery<Result = unknown, Variables = unknown>(
  query: string,
  options: ExecuteQueryOptions<Variables>,
): Promise<[Result, Response]>;

export async function rawExecuteQuery<Result, Variables>(
  /** The GraphQL query to execute */
  query: string | GraphQLWeb.DocumentNode,
  /** Execution options, including API token and variables for query execution */
  options: RawExecuteQueryOptions<Variables>,
) {
  if (!query) {
    throw new Error('Query is not valid');
  }

  const fetchFn =
    options.fetchFn ||
    (typeof fetch === 'undefined' ? undefined : fetch) ||
    (typeof globalThis === 'undefined' ? undefined : globalThis.fetch);

  if (typeof fetchFn === 'undefined') {
    throw new Error(
      'fetch() is not available: either polyfill it globally, or provide it as fetchFn option.',
    );
  }

  const serializedQuery = typeof query === 'string' ? query : print(query);

  const response = await fetchFn(
    'https://graphql.datocms.com/',
    buildRequestInit(serializedQuery, options),
  );

  const parsedBody = response.headers
    .get('content-type')
    ?.includes('application/json')
    ? ((await response.json()) as {
        data: Result;
        errors?: unknown;
      })
    : await response.text();

  const autoRetry = 'autoRetry' in options ? options.autoRetry : true;

  if (response.status === 429 && autoRetry) {
    const rateLimitReset = response.headers.get('X-RateLimit-Reset');
    const retryCount = (options.retryCount || 0) + 1;

    const waitTimeInSecs = rateLimitReset
      ? Number.parseInt(rateLimitReset, 10)
      : retryCount;

    await wait(waitTimeInSecs * 1000);

    return rawExecuteQuery<Result, Variables>(serializedQuery, {
      ...options,
      retryCount,
    } as RawExecuteQueryOptions<Variables>);
  }

  if (
    !response.ok ||
    typeof parsedBody === 'string' ||
    (typeof parsedBody === 'object' && 'errors' in parsedBody)
  ) {
    throw new ApiError(
      {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: parsedBody,
      },
      serializedQuery,
      options,
    );
  }

  return [parsedBody.data, response];
}

/**
 * Executes a GraphQL query using the DatoCMS Content Delivery API
 */
export function executeQuery<Result = unknown, Variables = unknown>(
  query: TypedDocumentNode<Result, Variables>,
  options: ExecuteQueryOptions<Variables>,
): Promise<Result>;

export function executeQuery<Result = unknown, Variables = unknown>(
  query: GraphQLWeb.DocumentNode,
  options: ExecuteQueryOptions<Variables>,
): Promise<Result>;

export function executeQuery<Result = unknown, Variables = unknown>(
  query: string,
  options: ExecuteQueryOptions<Variables>,
): Promise<Result>;

export async function executeQuery<Result, Variables>(
  /** The GraphQL query to execute */
  query: string | TypedDocumentNode<Result, Variables>,
  /** Execution options, including API token and variables for query execution */
  options: ExecuteQueryOptions<Variables>,
) {
  const result = await rawExecuteQuery(query as string, options);
  return result[0];
}

function wait(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}
