# @datocms/cda-client

## 0.3.2

### Patch Changes

- f0d3603: Add jitter to the rate-limit retry
  
  Many concurrent requests hitting a 429 at once (e.g. a static build rendering
  pages in parallel) used to all retry on the exact same tick, immediately
  re-triggering the same rate limit. Retries are now spread out with a random
  extra wait on top of the required one.

## 0.3.1

### Patch Changes

- 70f126d: Keep the API token out of the errors the client throws
  
  `ApiError` stored the options of the failed query verbatim, so `error.options.token`
  held the API token in clear text — and travelled with the error into
  `console.error()` output shipped to log aggregators, into error trackers, and
  into any HTTP handler that echoed the error back to its caller.
  
  The token is now replaced by `[REDACTED, ending in abcd]`, which still tells two
  tokens apart while debugging; the real one only ever reaches the `Authorization`
  header. For the same reason `query`, `options` and `response` are now
  non-enumerable: reading `error.options` explicitly works exactly as before, but
  the details of the failed query no longer travel through `JSON.stringify()`,
  object spread or `serialize-error` by accident.
