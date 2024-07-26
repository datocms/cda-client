export type BuildRequestHeadersOptions = {
  /**
   * DatoCMS API token to use
   *
   * Read more: https://www.datocms.com/docs/content-delivery-api/authentication
   */
  token: string;
  /**
   * If true, return draft version of records instead of published ones
   *
   * Read more: https://www.datocms.com/docs/content-delivery-api/api-endpoints#preview-mode-to-retrieve-draft-content
   */
  includeDrafts?: boolean;
  /**
   * If true, filter out invalid records, and narrow down GraphQL types where possible
   *
   * Read more: https://www.datocms.com/docs/content-delivery-api/api-endpoints#strict-mode-for-non-nullable-graphql-types
   */
  excludeInvalid?: boolean;
  /**
   * The name of the DatoCMS environment where to perform the query (defaults to primary environment)
   *
   * Read more: https://www.datocms.com/docs/content-delivery-api/api-endpoints#specifying-an-environment
   */
  environment?: string;
  /**
   * If true, embed metadata that enable Content Link
   *
   * Read more: https://www.datocms.com/docs/content-delivery-api/api-endpoints#content-link
   */
  contentLink?: 'vercel-v1';
  /**
   * The base URL of your DatoCMS project (ie. `https://<YOUR-PROJECT-NAME>.admin.datocms.com`)
   *
   * Read more: https://www.datocms.com/docs/content-delivery-api/api-endpoints#content-link
   */
  baseEditingUrl?: string;
  /**
   * If true, receive the Cache Tags associated with the query
   *
   * Read more: https://www.datocms.com/docs/content-delivery-api/api-endpoints#cache-tags
   */
  returnCacheTags?: boolean;
};

export function buildRequestHeaders(
  options: BuildRequestHeadersOptions,
): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/json',
    // API token for the project
    Authorization: `Bearer ${options.token}`,
  };

  if (options.includeDrafts) {
    headers['X-Include-Drafts'] = 'true';
  }

  if (options.excludeInvalid) {
    headers['X-Exclude-Invalid'] = 'true';
  }

  if (options.environment) {
    headers['X-Environment'] = options.environment;
  }

  if (options.returnCacheTags) {
    headers['X-Cache-Tags'] = 'true';
  }

  if (options.contentLink) {
    headers['X-Visual-Editing'] = options.contentLink;
  }

  if (options.baseEditingUrl) {
    headers['X-Base-Editing-Url'] = options.baseEditingUrl;
  }

  return headers;
}
