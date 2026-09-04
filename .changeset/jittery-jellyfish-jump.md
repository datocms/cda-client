---
'@datocms/cda-client': patch
---

Add jitter to the rate-limit retry

Many concurrent requests hitting a 429 at once (e.g. a static build rendering
pages in parallel) used to all retry on the exact same tick, immediately
re-triggering the same rate limit. Retries are now spread out with a random
extra wait on top of the required one.
