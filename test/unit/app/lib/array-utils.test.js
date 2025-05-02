import { arraysAreEqual } from '../../../../app/lib/array-utils'

describe('arraysAreEqual', () => {
  test('returns true for equal arrays of numbers', () => {
    expect(arraysAreEqual([1, 2, 3], [1, 2, 3])).toBe(true)
  })

  test('returns false for arrays of different lengths', () => {
    expect(arraysAreEqual([1, 2], [1, 2, 3])).toBe(false)
  })

  test('returns false for same-length arrays with different elements', () => {
    expect(arraysAreEqual([1, 2, 3], [1, 2, 4])).toBe(false)
  })

  test('returns true for empty arrays', () => {
    expect(arraysAreEqual([], [])).toBe(true)
  })

  test('returns true for equal arrays of strings', () => {
    expect(arraysAreEqual(['a', 'b'], ['a', 'b'])).toBe(true)
  })

  test('returns false for arrays with same elements in different order', () => {
    expect(arraysAreEqual([1, 2, 3], [3, 2, 1])).toBe(false)
  })

  test('returns false when comparing different types', () => {
    expect(arraysAreEqual([1, '2', 3], [1, 2, 3])).toBe(false)
  })

  test('returns true for arrays with same boolean values', () => {
    expect(arraysAreEqual([true, false], [true, false])).toBe(true)
  })
})
