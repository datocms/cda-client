import type * as GraphQLWeb from '@0no-co/graphql.web';
import { print } from '@0no-co/graphql.web';
import { buildRequestHeaders } from './buildRequestHeaders';
import type { ExecuteQueryOptions } from './executeQuery';

/**
 * Builds the request initialization object for a GraphQL query towards DatoCMS
 * Content Delivery API.
 *
 * @return {RequestInit} The built request initialization object
 */
export function buildRequestInit(
  /** The GraphQL query to execute */
  query: string | GraphQLWeb.DocumentNode,
  /** Execution options, including API token and variables for query execution */
  options: ExecuteQueryOptions,
) {
  const stringifiedQuery = typeof query === 'string' ? query : print(query);

  return {
    method: 'POST',
    headers: buildRequestHeaders(options),
    body: JSON.stringify({
      query: stringifiedQuery,
      variables: options?.variables,
    }),
  } as const;
}
