import { parse, print } from '@0no-co/graphql.web';
import { expect, test } from 'vitest';
import {
  convertToAutoPaginationQueryAndVariables,
  mergeAutoPaginationSplittedResults,
} from '../executeQueryWithAutoPagination';

test('convertToAutoPaginationQueryAndVariables: no variables, first > 100', () => {
  const query = parse(/* GraphQL */ `
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
  `);

  const [newQuery, variables] = convertToAutoPaginationQueryAndVariables(query);
  expect([print(newQuery), variables]).toMatchSnapshot();
});

test('convertToAutoPaginationQueryAndVariables: no variables, first > 100, starting from item 14', () => {
  const query = parse(/* GraphQL */ `
    query BuildSitemapUrls {
      allBlogPosts {
        slug
      }
      entries: allSuccessStories(skip: 13, first: 526) {
        ...SuccessStoryUrlFragment
      }
    }

    fragment SuccessStoryUrlFragment on SuccessStoryRecord {
      slug
    }
  `);

  const [newQuery, variables] = convertToAutoPaginationQueryAndVariables(query);
  expect([print(newQuery), variables]).toMatchSnapshot();
});

test('convertToAutoPaginationQueryAndVariables: multiple selections to paginate', () => {
  const query = parse(/* GraphQL */ `
    query BuildSitemapUrls {
      allBlogPosts(first: 2500) {
        slug
      }
      entries: allSuccessStories(first: 2500) {
        ...SuccessStoryUrlFragment
      }
    }

    fragment SuccessStoryUrlFragment on SuccessStoryRecord {
      slug
    }
  `);

  expect(() =>
    convertToAutoPaginationQueryAndVariables(query),
  ).toThrowErrorMatchingSnapshot();
});

test('convertToAutoPaginationQueryAndVariables: no variables, first < 100', () => {
  const query = parse(/* GraphQL */ `
    query BuildSitemapUrls {
      entries: allSuccessStories(first: 50) {
        slug
      }
    }
  `);

  const [newQuery, variables] = convertToAutoPaginationQueryAndVariables(
    query,
    { other: 'foo' },
  );

  expect([print(newQuery), variables]).toMatchSnapshot();
});

test('convertToAutoPaginationQueryAndVariables: variable `first` arg, missing variables', () => {
  const query = parse(/* GraphQL */ `
    query BuildSitemapUrls($first: IntType!) {
      entries: allSuccessStories(first: $first) {
        ...SuccessStoryUrlFragment
      }
    }

    fragment SuccessStoryUrlFragment on SuccessStoryRecord {
      slug
    }
  `);

  expect(() =>
    convertToAutoPaginationQueryAndVariables(query),
  ).toThrowErrorMatchingSnapshot();
});

test('convertToAutoPaginationQueryAndVariables: variable `first` arg, with variables, `first` > 100', () => {
  const query = parse(/* GraphQL */ `
    query BuildSitemapUrls($first: IntType!) {
      entries: allSuccessStories(first: $first) {
        ...SuccessStoryUrlFragment
      }
    }

    fragment SuccessStoryUrlFragment on SuccessStoryRecord {
      slug
    }
  `);

  const [newQuery, variables] = convertToAutoPaginationQueryAndVariables(
    query,
    { first: 2500, other: 'foo' },
  );
  expect([print(newQuery), variables]).toMatchSnapshot();
});

test('convertToAutoPaginationQueryAndVariables: variable `first` arg, with variables, `first` < 100', () => {
  const query = parse(/* GraphQL */ `
    query BuildSitemapUrls($first: IntType!) {
      entries: allSuccessStories(first: $first) {
        slug
      }
    }
  `);

  const [newQuery, variables] = convertToAutoPaginationQueryAndVariables(
    query,
    { first: 50, other: 'foo' },
  );

  expect([print(newQuery), variables]).toMatchSnapshot();
});

test('mergeAutoPaginationSplittedResults: nothing to merge', () => {
  expect(
    mergeAutoPaginationSplittedResults({
      something: [
        {
          entries: [{ slug: 'foo' }],
        },
      ],
    }),
  ).toMatchSnapshot();
});

test('mergeAutoPaginationSplittedResults: splitted results to merge', () => {
  expect(
    mergeAutoPaginationSplittedResults({
      something: [
        {
          splitted_0_entries: [{ slug: 'foo' }],
          splitted_100_entries: [{ slug: 'bar' }],
          splitted_200_entries: [{ slug: 'qux' }],
        },
      ],
    }),
  ).toMatchSnapshot();
});
