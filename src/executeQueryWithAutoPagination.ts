import {
  type ArgumentNode,
  type FieldNode,
  Kind,
  type SelectionNode,
  parse,
  visit,
} from '@0no-co/graphql.web';

import type * as GraphQLWeb from '@0no-co/graphql.web';

import {
  type ExecuteQueryOptions,
  type TypedDocumentNode,
  rawExecuteQuery,
} from './executeQuery';

const MAX_PAGINATION_LENGTH = 500;

/**
 * Extends the functionality of `rawExecuteQuery()` with automatic pagination
 * support for queries where the `first:` argument surpasses the Content
 * Delivery API's result limit.
 *
 * Key Characteristics:
 * * Automatically handles pagination for a single query selection with a large
 *   `first:` argument
 * * Transparently manages fetching of paginated results behind the scenes
 *
 * Constraints:
 * * Only works when a single selection in the query has an oversized `first:`
 *   argument
 * * Multiple selections with large `first:` arguments will trigger an error
 */
export function rawExecuteQueryWithAutoPagination<
  Result = unknown,
  Variables = unknown,
>(
  query: TypedDocumentNode<Result, Variables>,
  options: ExecuteQueryOptions<Variables>,
): Promise<[Result, Response]>;

export function rawExecuteQueryWithAutoPagination<
  Result = unknown,
  Variables = unknown,
>(
  query: GraphQLWeb.DocumentNode,
  options: ExecuteQueryOptions<Variables>,
): Promise<[Result, Response]>;

export function rawExecuteQueryWithAutoPagination<
  Result = unknown,
  Variables = unknown,
>(
  query: string,
  options: ExecuteQueryOptions<Variables>,
): Promise<[Result, Response]>;

export async function rawExecuteQueryWithAutoPagination<
  Result = unknown,
  Variables = unknown,
>(
  query: string | GraphQLWeb.DocumentNode,
  options: ExecuteQueryOptions<Variables>,
): Promise<[Result, Response]> {
  if (!query) {
    throw new Error('Query is not valid');
  }

  const parsedQuery = typeof query === 'string' ? parse(query) : query;

  const [newQuery, newVariables] = convertToAutoPaginationQueryAndVariables(
    parsedQuery,
    options.variables,
  );

  const [result, response] = await rawExecuteQuery(newQuery, {
    ...options,
    variables: newVariables,
  });

  return [mergeAutoPaginationSplittedResults(result) as Result, response];
}

/**
 * Extends the functionality of `executeQuery()` with automatic pagination
 * support for queries where the `first:` argument surpasses the Content
 * Delivery API's result limit.
 *
 * Key Characteristics:
 * * Automatically handles pagination for a single query selection with a large
 *   `first:` argument
 * * Transparently manages fetching of paginated results behind the scenes
 *
 * Constraints:
 * * Only works when a single selection in the query has an oversized `first:`
 *   argument
 * * Multiple selections with large `first:` arguments will trigger an error
 */
export function executeQueryWithAutoPagination<
  Result = unknown,
  Variables = unknown,
>(
  query: TypedDocumentNode<Result, Variables>,
  options: ExecuteQueryOptions<Variables>,
): Promise<Result>;

export function executeQueryWithAutoPagination<
  Result = unknown,
  Variables = unknown,
>(
  query: GraphQLWeb.DocumentNode,
  options: ExecuteQueryOptions<Variables>,
): Promise<Result>;

export function executeQueryWithAutoPagination<
  Result = unknown,
  Variables = unknown,
>(query: string, options: ExecuteQueryOptions<Variables>): Promise<Result>;

export async function executeQueryWithAutoPagination<Result, Variables>(
  /** The GraphQL query to execute */
  query: string | TypedDocumentNode<Result, Variables>,
  /** Execution options, including API token and variables for query execution */
  options: ExecuteQueryOptions<Variables>,
) {
  const result = await rawExecuteQueryWithAutoPagination(
    query as string,
    options,
  );
  return result[0];
}

export function convertToAutoPaginationQueryAndVariables<
  Result = unknown,
  Variables = unknown,
>(
  query: TypedDocumentNode<Result, Variables>,
  originalVariables?: Variables,
): [TypedDocumentNode<Result, Partial<Variables>>, Partial<Variables>] {
  let variables = (originalVariables || {}) as Record<string, unknown>;
  let variablesToExclude: string[] = [];
  let alreadyFoundCollectionSelectionSetThatNeedsToBeDuped = false;

  const newSelectionQuery = visit(query, {
    SelectionSet: {
      enter: () => {},
      leave: (selectionSet) => {
        const newSelections: SelectionNode[] = [];

        // end goal: we want to take all allXXXX() {} selection sets
        for (const selectionNode of selectionSet.selections) {
          const info = parseCollectionSelectionSetThatNeedsToBeDuped(
            selectionNode,
            (originalVariables || {}) as Record<string, unknown>,
          );

          if (!info) {
            newSelections.push(selectionNode);
            continue;
          }

          if (alreadyFoundCollectionSelectionSetThatNeedsToBeDuped) {
            throw new Error(
              'Cannot auto-paginate multiple selections in a single query!',
            );
          }

          alreadyFoundCollectionSelectionSetThatNeedsToBeDuped = true;

          variables = omit(variables, info.variablesToExclude);

          variablesToExclude = [
            ...variablesToExclude,
            ...info.variablesToExclude,
          ];

          let skip: number;

          for (
            skip = info.initialSkip;
            info.numberOfTotalRecords - skip + info.initialSkip > 0;
            skip += MAX_PAGINATION_LENGTH
          ) {
            const newSelectionNode: FieldNode = {
              ...(selectionNode as FieldNode),
              alias: {
                kind: Kind.NAME,
                value: `splitted_${skip}_${info.aliasName}`,
              },
              arguments: [
                ...info.argumentNodesToMantain,
                {
                  kind: Kind.ARGUMENT,
                  name: {
                    kind: Kind.NAME,
                    value: 'first',
                  },
                  value: {
                    kind: Kind.INT,
                    value: Math.min(
                      info.numberOfTotalRecords - skip + info.initialSkip,
                      MAX_PAGINATION_LENGTH,
                    ).toString(),
                  },
                },
                {
                  kind: Kind.ARGUMENT,
                  name: {
                    kind: Kind.NAME,
                    value: 'skip',
                  },
                  value: {
                    kind: Kind.INT,
                    value: skip.toString(),
                  },
                },
              ],
            };

            newSelections.push(newSelectionNode);
          }
        }

        return {
          ...selectionSet,
          selections: newSelections,
        };
      },
    },
  });

  const newQuery = visit(newSelectionQuery, {
    OperationDefinition: {
      enter: () => {},
      leave: (operationDefinition) => {
        return {
          ...operationDefinition,
          variableDefinitions: operationDefinition.variableDefinitions?.filter(
            (variableDefinition) => {
              return !variablesToExclude.includes(
                variableDefinition.variable.name.value,
              );
            },
          ),
        };
      },
    },
  });

  return [newQuery, variables as Partial<Variables>];
}

function parseCollectionSelectionSetThatNeedsToBeDuped(
  selectionNode: SelectionNode,
  variables: Record<string, unknown>,
) {
  const variablesToExclude: string[] = [];

  // ie. ignore _allXXXMeta
  if (
    selectionNode.kind !== Kind.FIELD ||
    selectionNode.name.value.startsWith('_')
  ) {
    return false;
  }

  const argumentNodesToMantain: ArgumentNode[] = [];

  let firstArg: ArgumentNode | undefined;
  let skipArg: ArgumentNode | undefined;

  for (const existingArg of selectionNode.arguments ?? []) {
    if (existingArg.name.value === 'first') {
      firstArg = existingArg;
    } else if (existingArg.name.value === 'skip') {
      skipArg = existingArg;
    } else {
      argumentNodesToMantain.push(existingArg);
    }
  }

  // ignore if it does not have `first:` argument
  if (!firstArg) {
    return false;
  }

  let numberOfTotalRecords: number | undefined;

  if (firstArg.value.kind === Kind.INT) {
    numberOfTotalRecords = Number.parseInt(firstArg.value.value);
  } else if (firstArg.value.kind === Kind.VARIABLE) {
    const value = variables[firstArg.value.name.value];

    if (typeof value !== 'number') {
      throw new Error(
        `Expected variable '${firstArg.value.name.value}' to be a number`,
      );
    }

    numberOfTotalRecords = value;
    variablesToExclude.push(firstArg.value.name.value);
  }

  // ignore if first < MAX_PAGINATION_LENGTH
  if (!numberOfTotalRecords || numberOfTotalRecords <= MAX_PAGINATION_LENGTH) {
    return false;
  }

  const fieldName = selectionNode.name.value;
  const aliasName = selectionNode.alias?.value || fieldName;

  let initialSkip = 0;

  if (skipArg?.value?.kind === Kind.INT) {
    initialSkip = Number.parseInt(skipArg.value.value);
  } else if (skipArg?.value?.kind === Kind.VARIABLE) {
    const variableValue = variables[skipArg.value.name.value];

    if (typeof variableValue !== 'number') {
      throw new Error(
        `Expected variable '${skipArg.value.name.value}' to be a number`,
      );
    }

    variablesToExclude.push(skipArg.value.name.value);
  }

  return {
    fieldName,
    aliasName,
    initialSkip,
    numberOfTotalRecords,
    variablesToExclude,
    argumentNodesToMantain,
  };
}

export function mergeAutoPaginationSplittedResults(
  originalData: unknown,
): unknown {
  if (!originalData || typeof originalData !== 'object') {
    return originalData;
  }

  if (Array.isArray(originalData)) {
    return originalData.map((record) =>
      mergeAutoPaginationSplittedResults(record),
    );
  }

  const finalData: Record<string, unknown> = {};

  for (const fullAliasName in originalData) {
    if (fullAliasName.startsWith('splitted_')) {
      const [, , ...rest] = fullAliasName.split('_');
      const aliasName = rest.join('_');

      const completeList = (finalData[aliasName] as unknown[]) || [];
      const records = (originalData as Record<string, unknown[]>)[
        fullAliasName
      ];

      for (const record of records) {
        completeList.push(mergeAutoPaginationSplittedResults(record));
      }

      finalData[aliasName] = completeList;
    } else {
      finalData[fullAliasName] = mergeAutoPaginationSplittedResults(
        (originalData as Record<string, unknown>)[fullAliasName],
      );
    }
  }

  return finalData;
}

function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  if (obj === null || obj === undefined) {
    return obj;
  }

  const result = { ...obj };

  for (const key of keys) {
    if (key in result) {
      delete result[key];
    }
  }

  return result;
}
