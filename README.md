<!--datocms-autoinclude-header start-->
<!--datocms-autoinclude-header end-->

# @datocms/cda-client

A lightweight, TypeScript-ready package that offers various helpers around the native Fetch API to perform GraphQL requests towards DatoCMS Content Delivery API.

## Installation

```bash
npm install @datocms/cda-client
```

## Usage

This package provides several utility functions to help you interact with the DatoCMS Content Delivery API using GraphQL.

### `executeQuery`

The main function to execute a GraphQL query against the DatoCMS Content Delivery API.

```typescript
import { executeQuery } from '@datocms/cda-client';

const result = await executeQuery(query, options);
```

#### Parameters

- `query`: A GraphQL query string, `DocumentNode`, or `TypedDocumentNode`.
- `options`: An object containing execution options.

#### Options

| Option            | Type          | Description                                           |
| ----------------- | ------------- | ----------------------------------------------------- |
| `token`           | `string`      | DatoCMS API token (required)                          |
| `includeDrafts`   | `boolean`     | If true, return draft versions of records             |
| `excludeInvalid`  | `boolean`     | If true, filter out invalid records                   |
| `environment`     | `string`      | Name of the DatoCMS environment for the query         |
| `contentLink`     | `'vercel-v1'` | If true, embed metadata for Content Link              |
| `baseEditingUrl`  | `string`      | Base URL of your DatoCMS project                      |
| `returnCacheTags` | `boolean`     | If true, receive Cache Tags associated with the query |
| `variables`       | `object`      | Variables to be sent with the query                   |
| `fetchFn`         | `function`    | Custom fetch function (optional)                      |
| `autoRetry`       | `boolean`     | Automatically retry on rate limit (default: true)     |

### `rawExecuteQuery`

Similar to `executeQuery`, but returns both the query result and the full response object. This can be handy when used together with returnCacheTags to actually retrieve the cache tags.

```typescript
import { rawExecuteQuery } from '@datocms/cda-client';

const [result, response] = await rawExecuteQuery(query, { token: 'your-api-token-here', returnCacheTags: true });
const cacheTags = response.headers.get('x-cache-tags');
```

### `buildRequestHeaders`

Builds request headers for a GraphQL query towards the DatoCMS Content Delivery API.

```typescript
import { buildRequestHeaders } from '@datocms/cda-client';

const headers = buildRequestHeaders(options);
```

#### Options

The `buildRequestHeaders` function accepts the same options as `executeQuery`, except for `variables`, `fetchFn`, and `autoRetry`.

### `buildRequestInit`

Builds the request initialization object for a GraphQL query towards the DatoCMS Content Delivery API.

```typescript
import { buildRequestInit } from '@datocms/cda-client';

const requestInit = buildRequestInit(query, options);
```

#### Parameters

- `query`: A GraphQL query string or `DocumentNode`.
- `options`: An object containing execution options (same as `executeQuery`).

## Error Handling

The package includes an `ApiError` class for handling API-specific errors. If an error occurs during query execution, an `ApiError` instance will be thrown, containing details about the error, including the status code, response body, and the original query and options.

## TypeScript Support

This package is built with TypeScript and provides type definitions out of the box. It supports `TypedDocumentNode` for improved type inference when using GraphQL Code Generator or similar tools.

## Examples

### Basic Query Execution

```typescript
import { executeQuery } from '@datocms/cda-client';

const query = `
  query {
    allArticles {
      id
      title
    }
  }
`;

const result = await executeQuery(query, {
  token: 'your-api-token-here',
});

console.log(result);
```

### Using with TypeScript and GraphQL Code Generator

```typescript
import { executeQuery } from '@datocms/cda-client';
import { AllArticlesQuery } from './generated/graphql';

const result = await executeQuery(AllArticlesQuery, {
  token: 'your-api-token-here',
  variables: {
    limit: 10,
  },
});

console.log(result.allArticles);
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.


<!--datocms-autoinclude-footer start-->
<!--datocms-autoinclude-footer end-->
