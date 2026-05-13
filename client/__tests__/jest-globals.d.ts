// Augment the global scope so TypeScript recognises `jest` as both a
// callable value and a type namespace in test files.  `@jest/globals`
// ships `declare const jest: Jest` which is the correct dual declaration,
// while `@types/jest` v29 only provides the namespace side.
import type { Jest } from '@jest/globals';

declare global {
  // eslint-disable-next-line no-var
  var jest: Jest;
}
