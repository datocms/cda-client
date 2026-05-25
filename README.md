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

Suppose you want to execute the following query on an model with `2500` records:

```graphql
query BuildSitemapUrls {
  allBlogPosts {
    slug
  }

  entries: allSuccessStories(first: 2500) {
    ...SuccessStoryUrlFragment
  }
}

fragment SuccessStoryUrlFragment on SuccessStoryRecord {
  slug
}
```

Well, that's a roadblock: The CDA is limited to returning a maximum of `500` items at a time. If you try to fetch more than that, you'll get an error. Instead, if you wanted to fetch all `2500` records, you would normally have to manually paginate it by executing the query multiple times, each time incrementing the `skip` parameter by an additional 500. That's a lot of work!

Fortunately, the helper function `executeQueryWithAutoPagination` does that on your behalf: the above query is analyzed and rewritten on the fly like this:

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
an oversized `first:` argument (i.e. the `first:` argument surpasses the Content Delivery API's result limit of `500`).
If two or more requested models have oversized pagination, the function will return an error.

The rewritten query must still respect the [GraphQL complexity cost](https://www.datocms.com/docs/content-delivery-api/complexity).

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

[DatoCMS](https://www.datocms.com/) is Headless CMS for the modern web. Trusted by 25,000+ businesses, agencies, and individuals, it gives your team one place to manage content and ship it to any website, app, or device via API.

**New here?** Start with [Create free account](https://dashboard.datocms.com/signup) and the [Documentation](https://www.datocms.com/docs). Stuck? Ask the [Community](https://community.datocms.com/). Curious what's new? [Product Updates](https://www.datocms.com/product-updates).

**Building with AI:** [Agent Skills](https://www.datocms.com/docs/agent-skills) turn coding assistants (Claude Code, Cursor) into expert DatoCMS developers, with full read/write via the auto-installed CLI. No local terminal? Use the [MCP Server](https://www.datocms.com/docs/mcp-server) instead.

**Talking to DatoCMS from code:**
- [Content Delivery API](https://www.datocms.com/docs/content-delivery-api) (CDA) — the fast, read-only GraphQL API your website/app uses to **fetch** published content.
- [Content Management API](https://www.datocms.com/docs/content-management-api) (CMA) — the REST API for **creating and updating** content, models, and project settings (think scripts, migrations, integrations).
- [CLI](https://www.datocms.com/docs/scripting-migrations/installing-the-cli) — terminal tool for schema migrations and importing from Contentful/WordPress.

**Framework guides:** end-to-end recipes for fetching content, rendering Structured Text, optimizing images/video, handling SEO, and setting up live preview with visual editing in [Next.js](https://www.datocms.com/docs/next-js), [Nuxt](https://www.datocms.com/docs/nuxt), [Svelte](https://www.datocms.com/docs/svelte), and [Astro](https://www.datocms.com/docs/astro).

**Want a head start?** Browse our [starter projects](https://www.datocms.com/marketplace/starters) — ready-to-deploy example sites for popular frameworks.


<!--datocms-autoinclude-footer end-->
