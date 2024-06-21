/**
 * @jest-environment jsdom
 */

import Util from '../../src/scripts/h5p-highlight-the-words-util';

const testCasesExtend = [
  {argument1: {}, argument2: {}, result: {}},
  {argument1: {}, argument2: {a: '123'}, result: {a: '123'}},
  {argument1: {a: 'foo'}, argument2: {}, result: {a: 'foo'}},
  {argument1: {a: 'foo'}, argument2: {a: '123'}, result: {a: '123'}},
  {argument1: {a: 'foo', b: []}, argument2: {a: '123'}, result: {a: '123', b: []}}
];

for (let i = 0; i < testCasesExtend.length; i++) {
  test('Do ' + testCasesExtend[i].argument1 + ' and ' + testCasesExtend[i].argument2 + ' return ' + testCasesExtend[i].result, () => {
    expect(Util.extend(
      testCasesExtend[i].argument1,
      testCasesExtend[i].argument2
    )).toEqual(testCasesExtend[i].result);
  });
}

const testCasesStripHTML = [
  {html: '', result: ''},
  {html: '<a href="https://foo.bar">foobar</a>', result: 'foobar'},
  {html: '<script>alert("security");</script>', result: 'alert("security");'},
  {html: '<div><script>alert("security");</script></div>', result: 'alert("security");'}
];

for (let i = 0; i < testCasesStripHTML.length; i++) {
  test('Does' + testCasesStripHTML[i].html + ' be turned into ' + testCasesStripHTML[i].result, () => {
    expect(Util.stripHTML(
      testCasesStripHTML[i].html
    )).toBe(testCasesStripHTML[i].result);
  });
}
