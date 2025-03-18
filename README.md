<!--datocms-autoinclude-header start-->

<a href="https://www.datocms.com/"><img src="https://www.datocms.com/images/full_logo.svg" height="60"></a>

👉 [Visit the DatoCMS homepage](https://www.datocms.com) or see [What is DatoCMS?](#what-is-datocms)

---

<!--datocms-autoinclude-header end-->

# @datocms/cda-client

A lightweight, TypeScript-ready package that offers various helpers around the native Fetch API to perform GraphQL requests towards DatoCMS [Content Delivery API](https://www.datocms.com/docs/content-delivery-api).

## TypeScript Support

This package is built with TypeScript and provides type definitions out of the box. It supports `TypedDocumentNode` for improved type inference when using [gql.tada](https://gql-tada.0no.co/), [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) or similar tools.

## Examples

### Basic Query Execution

```typescript
import { executeQuery } from "@datocms/cda-client";

const query = `
  query {
    allArticles {
      id
      title
    }
  }
`;

const result = await executeQuery(query, {
  token: "your-api-token-here",
});

console.log(result);
```

### Using with TypeScript and GraphQL Code Generator

```typescript
import { executeQuery } from "@datocms/cda-client";
import { AllArticlesQuery } from "./generated/graphql";

const result = await executeQuery(AllArticlesQuery, {
  token: "your-api-token-here",
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
import { executeQuery } from "@datocms/cda-client";

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
import { rawExecuteQuery } from "@datocms/cda-client";

const [result, response] = await rawExecuteQuery(query, {
  token: "your-api-token-here",
  returnCacheTags: true,
});
const cacheTags = response.headers.get("x-cache-tags");
```

### `executeQueryWithAutoPagination`

This function comes handy when the query contains a paginated collection: behind the scene,
`executeQueryWithAutoPagination` reworks the passed query and collects the results, so that
it's possible to get a collection of records that is longer than Content Delivery API's result limit.
That is done with a single API call, in a transparent way.

```typescript
import { executeQueryWithAutoPagination } from "@datocms/cda-client";

const result = await executeQueryWithAutoPagination(query, options);
```

#### Parameters

Parameters are the same available for `executeQuery`:

- `query`: A GraphQL query string, `DocumentNode`, or `TypedDocumentNode`.
- `options`: An object containing execution options with the same shape of options for `executeQuery`.

### How does it work?

Suppose you want to execute the following query:

```graphql
query BuildSitemapUrls {
  allBlogPosts {
    slug
  }

  entries: allSuccessStories(first: 500) {
    ...SuccessStoryUrlFragment
  }
}

fragment SuccessStoryUrlFragment on SuccessStoryRecord {
  slug
}
```

Well, that's a roadblock: DatoCMS CDA has limitations on the pagination page length (currently 500 items).

That means you should introduce a variable and execute the query multiple times, each time skipping the record
that have been returned by the previous query.

`executeQueryWithAutoPagination` does that on your behalf: the above query is analyzed and rewritten on the fly like this:

```graphql
query BuildSitemapUrls {
  allBlogPosts {
    slug
  }
  splitted_0_entries: allSuccessStories(first: 500, skip: 0) {
    ...SuccessStoryUrlFragment
  }
  splitted_500_entries: allSuccessStories(first: 500, skip: 500) {
    ...SuccessStoryUrlFragment
  }
  splitted_1000_entries: allSuccessStories(first: 500, skip: 1000) {
    ...SuccessStoryUrlFragment
  }
  splitted_1500_entries: allSuccessStories(first: 500, skip: 1500) {
    ...SuccessStoryUrlFragment
  }
  splitted_2000_entries: allSuccessStories(first: 500, skip: 2000) {
    ...SuccessStoryUrlFragment
  }
}

fragment SuccessStoryUrlFragment on SuccessStoryRecord {
  slug
}
```

Once executed, the results get collected and recomposed as if nothing happened.

#### Limitations

`executeQueryWithAutoPagination` works only when the query contains only one selection that has 
an oversized `first:` argument (i.e. `first:` argument surpasses the Content Delivery API's result limit).
If two or more fields have oversiaed patination, the function triggers an error.

The rewritten query must still respect the [complexity cost](https://www.datocms.com/docs/content-delivery-api/complexity).

### `rawExecuteQueryWithAutoPagination`

As for `executeQuery`, also `executeQueryWithAutoPagination` has a pair raw version that returns both the query result and the full response object.
This can be handy when used together with returnCacheTags to actually retrieve the cache tags.

```typescript
import { rawExecuteQueryWithAutoPagination } from "@datocms/cda-client";

const [result, response] = await rawExecuteQueryWithAutoPagination(query, {
  token: "your-api-token-here",
  returnCacheTags: true,
});
const cacheTags = response.headers.get("x-cache-tags");
```

### `buildRequestHeaders`

Builds request headers for a GraphQL query towards the DatoCMS Content Delivery API.

```typescript
import { buildRequestHeaders } from "@datocms/cda-client";

const headers = buildRequestHeaders(options);
```

#### Options

The `buildRequestHeaders` function accepts the same options as `executeQuery`, except for `variables`, `fetchFn`, and `autoRetry`.

### `buildRequestInit`

Builds the request initialization object for a GraphQL query towards the DatoCMS Content Delivery API.

```typescript
import { buildRequestInit } from "@datocms/cda-client";

const requestInit = buildRequestInit(query, options);
```

#### Parameters

- `query`: A GraphQL query string or `DocumentNode`.
- `options`: An object containing execution options (same as `executeQuery`).

## Error Handling

In case a query fails (either with an HTTP status code outside of the 2xx range, or for an error in the query), an `ApiError` exception will be thrown by the client. This error contains all the details of the request and response, allowing you to debug and handle errors effectively.

### Example

```typescript
import { executeQuery, ApiError } from "@datocms/cda-client";

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
    token: "your-api-token-here",
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

<a href="https://www.datocms.com/"><img src="https://www.datocms.com/images/full_logo.svg" height="60" alt="DatoCMS - The Headless CMS for the Modern Web"></a>

[DatoCMS](https://www.datocms.com/) is the REST & GraphQL Headless CMS for the modern web.

Trusted by over 25,000 enterprise businesses, agencies, and individuals across the world, DatoCMS users create online content at scale from a central hub and distribute it via API. We ❤️ our [developers](https://www.datocms.com/team/best-cms-for-developers), [content editors](https://www.datocms.com/team/content-creators) and [marketers](https://www.datocms.com/team/cms-digital-marketing)!

**Why DatoCMS?**

- **API-First Architecture**: Built for both REST and GraphQL, enabling flexible content delivery
- **Just Enough Features**: We believe in keeping things simple, and giving you [the right feature-set tools](https://www.datocms.com/features) to get the job done
- **Developer Experience**: First-class TypeScript support with powerful developer tools

**Getting Started:**

- ⚡️ [Create Free Account](https://dashboard.datocms.com/signup) - Get started with DatoCMS in minutes
- 🔖 [Documentation](https://www.datocms.com/docs) - Comprehensive guides and API references
- ⚙️ [Community Support](https://community.datocms.com/) - Get help from our team and community
- 🆕 [Changelog](https://www.datocms.com/product-updates) - Latest features and improvements

**Official Libraries:**

- [**Content Delivery Client**](https://github.com/datocms/cda-client) - TypeScript GraphQL client for content fetching
- [**REST API Clients**](https://github.com/datocms/js-rest-api-clients) - Node.js/Browser clients for content management
- [**CLI Tools**](https://github.com/datocms/cli) - Command-line utilities for schema migrations (includes [Contentful](https://github.com/datocms/cli/tree/main/packages/cli-plugin-contentful) and [WordPress](https://github.com/datocms/cli/tree/main/packages/cli-plugin-wordpress) importers)

**Official Framework Integrations**

Helpers to manage SEO, images, video and Structured Text coming from your DatoCMS projects:

- [**React Components**](https://github.com/datocms/react-datocms)
- [**Vue Components**](https://github.com/datocms/vue-datocms)
- [**Svelte Components**](https://github.com/datocms/datocms-svelte)
- [**Astro Components**](https://github.com/datocms/astro-datocms)

**Additional Resources:**

- [**Plugin Examples**](https://github.com/datocms/plugins) - Example plugins we've made that extend the editor/admin dashboard
- [**Starter Projects**](https://www.datocms.com/marketplace/starters) - Example website implementations for popular frameworks
- [**All Public Repositories**](https://github.com/orgs/datocms/repositories?q=&type=public&language=&sort=stargazers)

<!--datocms-autoinclude-footer end-->
