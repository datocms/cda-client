import type * as GraphQLWeb from '@0no-co/graphql.web';
import { print } from '@0no-co/graphql.web';
import {
  type BuildRequestHeadersOptions,
  buildRequestHeaders,
} from './buildRequestHeaders';

export type BuildRequestInitOptions<Variables = unknown> =
  BuildRequestHeadersOptions & {
    /** The variables to be sent with the query */
    variables?: Variables;
    /** Additional request initialization options */
    requestInitOptions?: Partial<RequestInit>;
  };

/**
 * Builds the request initialization object for a GraphQL query towards DatoCMS
 * Content Delivery API.
 *
 * @return {RequestInit} The built request initialization object
 */
export function buildRequestInit<Variables = unknown>(
  /** The GraphQL query to execute */
  query: string | GraphQLWeb.DocumentNode,
  /** Execution options, including API token and variables for query execution */
  options: BuildRequestInitOptions<Variables>,
) {
  const stringifiedQuery = typeof query === 'string' ? query : print(query);

  return {
    method: 'POST',
    headers: buildRequestHeaders(options),
    body: JSON.stringify({
      query: stringifiedQuery,
      variables: options?.variables,
    }),
    ...options?.requestInitOptions,
  } as const;
}
