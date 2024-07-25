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
    variables?: Variables;
    fetchFn?: typeof fetch;
  };

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

/**
 * Executes a GraphQL query using the DatoCMS Content Delivery API
 */
export async function rawExecuteQuery<Result, Variables>(
  query: string | GraphQLWeb.DocumentNode,
  options: ExecuteQueryOptions<Variables>,
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

  const response = await fetchFn(
    'https://graphql.datocms.com/',
    buildRequestInit(query, options),
  );

  const parsedBody = response.headers
    .get('content-type')
    ?.includes('application/json')
    ? ((await response.json()) as {
        data: Result;
        errors?: unknown;
      })
    : await response.text();

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
      typeof query === 'string' ? query : print(query),
      options,
    );
  }

  return [parsedBody.data, response];
}

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

/**
 * Executes a GraphQL query using the DatoCMS Content Delivery API
 */
export async function executeQuery<Result, Variables>(
  query: string | TypedDocumentNode<Result, Variables>,
  options: ExecuteQueryOptions<Variables>,
) {
  const result = await rawExecuteQuery(query as string, options);
  return result[0];
}
