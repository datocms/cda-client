export type BuildRequestHeadersOptions = {
  /** DatoCMS API token to use */
  token: string;
  /** If true, draft records will be returned */
  includeDrafts?: boolean;
  /** If true, invalid records will be filtered out */
  excludeInvalid?: boolean;
  /** The name of the DatoCMS environment where to perform the query (defaults to primary environment) */
  environment?: string;
  /** If true, embed metadata that enable Content Link */
  contentLink?: true | 'vercel-v1';
  /** The base URL of the DatoCMS project */
  baseEditingUrl?: string;
  /** If true, receive the Cache Tags associated with the query */
  cacheTags?: boolean;
};

export function buildRequestHeaders(
  options: BuildRequestHeadersOptions,
): HeadersInit {
  // Headers to instruct DatoCMS on how to process the request:
  const headers: HeadersInit = {
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
    headers['X-Environment'] = 'true';
  }

  if (options.cacheTags) {
    headers['X-Cache-Tags'] = 'true';
  }

  if (options.contentLink) {
    headers['X-Visual-Editing'] =
      options.contentLink === true ? 'vercel-v1' : options.contentLink;
  }

  if (options.baseEditingUrl) {
    headers['X-Base-Editing-Url'] = options.baseEditingUrl;
  }

  return headers;
}
