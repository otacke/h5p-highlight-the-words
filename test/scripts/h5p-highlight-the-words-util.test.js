import Util from '../../src/scripts/h5p-highlight-the-words-util';
import TextProcessing from '../../src/scripts/h5p-highlight-the-words-text-processing';

const testCasesIndexOfUnescaped = [
  {string: '', char: '*', result: -1},
  {string: 'foobar', char: '*', result: -1},
  {string: '*', char: '*', result: 0},
  {string: 'abc*', char: '*', result: 3},
  {string: '\\*', char: '*', result: -1},
  {string: 'abc\\*', char: '*', result: -1},
  {string: '\\\\*', char: '*', result: 1},
  {string: 'abc\\\\*', char: '*', result: 4},
  {string: '\\*\\*', char: '*', result: -1},
  {string: 'abc\\*def*', char: '*', result: 7},
  {string: 'abc\\*def\\*', char: '*', result: -1},
  {string: 'abc\\*def\\\\*', char: '*', result: 8},
  {string: '\\*\\*\\\\*', char: '*', result: 3},

  {string: 'foobar**abc', char: '**', result: 6},
  {string: 'foobar\\**abc', char: '**', result: -1},
  {string: 'foobar\\\\**abc', char: '**', result: 7},
];

for (let i = 0; i < testCasesIndexOfUnescaped.length; i++) {
  test('Does ' + testCasesIndexOfUnescaped[i].string + ' return ' + testCasesIndexOfUnescaped[i].result, () => {
    expect(TextProcessing.indexOfUnescaped(
      testCasesIndexOfUnescaped[i].string,
      testCasesIndexOfUnescaped[i].char
    )).toBe(testCasesIndexOfUnescaped[i].result);
  });
}
