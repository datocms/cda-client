<!--datocms-autoinclude-header start-->

<a href="https://www.datocms.com/"><img src="https://www.datocms.com/images/full_logo.svg" height="60"></a>

👉 [Visit the DatoCMS homepage](https://www.datocms.com) or see [What is DatoCMS?](#what-is-datocms)

---

<!--datocms-autoinclude-header end-->

# @datocms/cda-client

A lightweight, TypeScript-ready package that offers various helpers around the native Fetch API to perform GraphQL requests towards DatoCMS Content Delivery API.

## TypeScript Support

This package is built with TypeScript and provides type definitions out of the box. It supports `TypedDocumentNode` for improved type inference when using [gql.tada](https://gql-tada.0no.co/), [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) or similar tools.

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

| Option               | Type                   | Description                                                                                                                                                   |
| -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`              | `string`               | DatoCMS API token (required) [Read more](https://www.datocms.com/docs/content-delivery-api/authentication)                                                    |
| `includeDrafts`      | `boolean`              | If true, return draft versions of records [Read more](https://www.datocms.com/docs/content-delivery-api/api-endpoints#preview-mode-to-retrieve-draft-content) |
| `excludeInvalid`     | `boolean`              | If true, filter out invalid records [Read more](https://www.datocms.com/docs/content-delivery-api/api-endpoints#strict-mode-for-non-nullable-graphql-types)   |
| `environment`        | `string`               | Name of the DatoCMS environment for the query [Read more](https://www.datocms.com/docs/content-delivery-api/api-endpoints#specifying-an-environment)          |
| `contentLink`        | `'vercel-v1'`          | If true, embed metadata for Content Link [Read more](https://www.datocms.com/docs/content-delivery-api/api-endpoints#content-link)                            |
| `baseEditingUrl`     | `string`               | Base URL of your DatoCMS project [Read more](https://www.datocms.com/docs/content-delivery-api/api-endpoints#content-link)                                    |
| `returnCacheTags`    | `boolean`              | If true, receive Cache Tags associated with the query [Read more](https://www.datocms.com/docs/content-delivery-api/api-endpoints#cache-tags)                 |
| `variables`          | `object`               | Variables to be sent with the query                                                                                                                           |
| `fetchFn`            | `function`             | Custom fetch function (optional)                                                                                                                              |
| `requestInitOptions` | `Partial<RequestInit>` | Additional request initialization options (optional)                                                                                                          |
| `autoRetry`          | `boolean`              | Automatically retry on rate limit (default: true)                                                                                                             |


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

In case a query fails (either with an HTTP status code outside of the 2xx range, or for an error in the query), an `ApiError` exception will be thrown by the client. This error contains all the details of the request and response, allowing you to debug and handle errors effectively.

### Example

```typescript
import { executeQuery, ApiError } from '@datocms/cda-client';

const query = `
  query {
    allArticles {
      id
      title
    }
  }
`;

try {
  const result = await executeQuery(query, {
    token: 'your-api-token-here',
  });
  console.log(result);
} catch (e) {
  if (e instanceof ApiError) {
    // Information about the failed request
    console.log(e.query);
    console.log(e.options);

    // Information about the response
    console.log(e.response.status);
    console.log(e.response.statusText);
    console.log(e.response.headers);
    console.log(e.response.body);
  } else {
    // Handle other types of errors
    throw e;
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.


<!--datocms-autoinclude-footer start-->

---

# What is DatoCMS?
<a href="https://www.datocms.com/"><img src="https://www.datocms.com/images/full_logo.svg" height="60"></a>

[DatoCMS](https://www.datocms.com/) is the REST & GraphQL Headless CMS for the modern web.

Trusted by over 25,000 enterprise businesses, agency partners, and individuals across the world, DatoCMS users create online content at scale from a central hub and distribute it via API. We ❤️ our [developers](https://www.datocms.com/team/best-cms-for-developers), [content editors](https://www.datocms.com/team/content-creators) and [marketers](https://www.datocms.com/team/cms-digital-marketing)!

**Quick links:**

- ⚡️ Get started with a [free DatoCMS account](https://dashboard.datocms.com/signup)
- 🔖 Go through the [docs](https://www.datocms.com/docs)
- ⚙️ Get [support from us and the community](https://community.datocms.com/)
- 🆕 Stay up to date on new features and fixes on the [changelog](https://www.datocms.com/product-updates)

**Our featured repos:**
- [datocms/react-datocms](https://github.com/datocms/react-datocms): React helper components for images, Structured Text rendering, and more
- [datocms/js-rest-api-clients](https://github.com/datocms/js-rest-api-clients): Node and browser JavaScript clients for updating and administering your content. For frontend fetches, we recommend using our [GraphQL Content Delivery API](https://www.datocms.com/docs/content-delivery-api) instead.
- [datocms/cli](https://github.com/datocms/cli): Command-line interface that includes our [Contentful importer](https://github.com/datocms/cli/tree/main/packages/cli-plugin-contentful) and [Wordpress importer](https://github.com/datocms/cli/tree/main/packages/cli-plugin-wordpress)
- [datocms/plugins](https://github.com/datocms/plugins): Example plugins we've made that extend the editor/admin dashboard
- [DatoCMS Starters](https://www.datocms.com/marketplace/starters) has examples for various Javascript frontend frameworks

Or see [all our public repos](https://github.com/orgs/datocms/repositories?q=&type=public&language=&sort=stargazers)

<!--datocms-autoinclude-footer end-->
