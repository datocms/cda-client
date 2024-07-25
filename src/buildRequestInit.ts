import type * as GraphQLWeb from '@0no-co/graphql.web';
import { print } from '@0no-co/graphql.web';
import { buildRequestHeaders } from './buildRequestHeaders';
import type { ExecuteQueryOptions } from './executeQuery';

export function buildRequestInit(
  query: string | GraphQLWeb.DocumentNode,
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
