/**
 * @jest-environment jsdom
 */

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
  {string: 'abc\\*def*', char: '*', result: 8},
  {string: 'abc\\*def\\*', char: '*', result: -1},
  {string: 'abc\\*def\\\\*', char: '*', result: 9},
  {string: '\\*\\*\\\\*', char: '*', result: 5},
  {string: 'foobar**abc', char: '**', result: 6},
  {string: 'foobar\\**abc', char: '**', result: -1},
  {string: 'foobar\\\\**abc', char: '**', result: 7}
];

for (let i = 0; i < testCasesIndexOfUnescaped.length; i++) {
  test('Does ' + testCasesIndexOfUnescaped[i].string + ' return ' + testCasesIndexOfUnescaped[i].result, () => {
    expect(TextProcessing.indexOfUnescaped(
      testCasesIndexOfUnescaped[i].string,
      testCasesIndexOfUnescaped[i].char
    )).toBe(testCasesIndexOfUnescaped[i].result);
  });
}

const textCasesForParseExerciseText = [
  { // No highlight
    text: 'In a hole in the ground, there lived a hobbit',
    highlightNames: ['yellow'],
    result: {
      text: 'In a hole in the ground, there lived a hobbit',
      highlights: []
    }
  },
  { // No highlight, escaped * but outside of *foo*
    text: 'In a hole in the ground, there lived a \\* hobbit',
    highlightNames: ['yellow'],
    result: {
      text: 'In a hole in the ground, there lived a \\* hobbit',
      highlights: []
    }
  },
  { // No highlight, escaped * but outside of *foo*, only starting *
    text: 'In a hole in the ground, there lived a \\* hobbit*',
    highlightNames: ['yellow'],
    result: {
      text: 'In a hole in the ground, there lived a \\* hobbit*',
      highlights: []
    }
  },
  { // \* inside highlight text
    text: 'In a hole in the ground, there lived a *hob\\*bit::yellow*',
    highlightNames: ['yellow'],
    result: {
      text: 'In a hole in the ground, there lived a hob*bit',
      highlights: [{
        name: 'yellow',
        text: 'hob*bit',
        start: 39,
        end: 46
      }]
    }
  },
  { // \:: inside highlight text
    text: 'In a hole in the ground, there lived a *hob\\::bit::yellow*',
    highlightNames: ['yellow'],
    result: {
      text: 'In a hole in the ground, there lived a hob::bit',
      highlights: [{
        name: 'yellow',
        text: 'hob::bit',
        start: 39,
        end: 47
      }]
    }
  },
  { // Missing highlight name
    text: 'In a hole in the ground, there lived a *hobbit*',
    highlightNames: ['yellow'],
    result: {
      text: 'In a hole in the ground, there lived a hobbit',
      highlights: []
    }
  },
  { // One highlight
    text: 'In a hole in the ground, there lived a *hobbit::yellow*',
    highlightNames: ['yellow'],
    result: {
      text: 'In a hole in the ground, there lived a hobbit',
      highlights: [{
        name: 'yellow',
        text: 'hobbit',
        start: 39,
        end: 45
      }]
    }
  },
  { // Highlight not defined
    text: 'In a hole in the *ground::red*, there lived a *hobbit::yellow*',
    highlightNames: ['yellow'],
    result: {
      text: 'In a hole in the ground, there lived a hobbit',
      highlights: [{
        name: 'yellow',
        text: 'hobbit',
        start: 39,
        end: 45
      }]
    }
  },
  { // Multiple highlights
    text: 'In a hole in the *ground::red*, there lived a *hobbit::yellow*',
    highlightNames: ['yellow', 'red'],
    result: {
      text: 'In a hole in the ground, there lived a hobbit',
      highlights: [
        {
          name: 'red',
          text: 'ground',
          start: 17,
          end: 23
        },
        {
          name: 'yellow',
          text: 'hobbit',
          start: 39,
          end: 45
        },
      ]
    }
  },
];

for (let i = 0; i < textCasesForParseExerciseText.length; i++) {
  test(textCasesForParseExerciseText[i].text + '\n\nwith\n\n[' + textCasesForParseExerciseText[i].highlightNames.join(', ') + ']', () => {
    expect(TextProcessing.parseExerciseText(
      textCasesForParseExerciseText[i].text,
      textCasesForParseExerciseText[i].highlightNames
    )).toEqual(textCasesForParseExerciseText[i].result);
  });
}

const testCasesHTMLDecode = [
  {string: '', result: ''},
  {string: '&lt;', result: '<'},
  {string: '&nbsp;', result: '\u00a0'},
  {string: 'Tom&#39;s hut', result: 'Tom\'s hut'},
];

for (let i = 0; i < testCasesHTMLDecode.length; i++) {
  test('Does ' + testCasesHTMLDecode[i].string + ' return ' + testCasesHTMLDecode[i].result, () => {
    expect(TextProcessing.htmlDecode(
      testCasesHTMLDecode[i].string,
    )).toBe(testCasesHTMLDecode[i].result);
  });
}

const testCasesHTMLEncode = [
  {string: '', result: ''},
  {string: '<', result: '&#x3C;'},
  {string: '\u00a0', result: '&#xA0;'},
  {string: 'Tom\'s hut', result: 'Tom&#x27;s hut'},
];

for (let i = 0; i < testCasesHTMLEncode.length; i++) {
  test('Does ' + testCasesHTMLEncode[i].string + ' return ' + testCasesHTMLEncode[i].result, () => {
    expect(TextProcessing.htmlEncode(
      testCasesHTMLEncode[i].string,
    )).toBe(testCasesHTMLEncode[i].result);
  });
}

const testCaseshtmlEncodeMasked = [
  {
    html: '',
    mask: '',
    result: ''
  },
  {
    html: '<html>',
    mask: '000000',
    result: '<html>'
  },
  {
    html: '<html>',
    mask: '111111',
    result: '&#x3C;html&#x3E;'
  },
  {
    html: '<html><html><html>',
    mask: '000000111111000000',
    result: '<html>&#x3C;html&#x3E;<html>'
  }
];

for (let i = 0; i < testCaseshtmlEncodeMasked.length; i++) {
  test('Does ' + testCaseshtmlEncodeMasked[i].html + ' with ' + testCaseshtmlEncodeMasked[i].mask + ' return ' + testCaseshtmlEncodeMasked[i].result, () => {
    expect(TextProcessing.htmlEncodeMasked(
      testCaseshtmlEncodeMasked[i].html,
      testCaseshtmlEncodeMasked[i].mask
    )).toBe(testCaseshtmlEncodeMasked[i].result);
  });
}


const testCasesComputeTextCharacteristics = [
  {
    text: '',
    result: {
      encodedText: '',
      encodedMask: '',
      decodedText: '',
      decodedMask: ''
    }
  },
  {
    text: '<html>&#x3C;html&#x3E;<html>',
    result: {
      encodedText: '<html>&#x3C;html&#x3E;<html>',
      encodedMask: '0000001111111111111111000000',
      decodedText: '<html><html><html>',
      decodedMask: '000000111111000000'
    }
  },
  {
    text: '&#x3C;html&#x3E;',
    result: {
      encodedText: '&#x3C;html&#x3E;',
      encodedMask: '1111111111111111',
      decodedText: '<html>',
      decodedMask: '111111'
    }
  },
];

for (let i = 0; i < testCasesComputeTextCharacteristics.length; i++) {
  test(testCasesComputeTextCharacteristics[i].text, () => {
    expect(TextProcessing.computeTextCharacteristics(
      testCasesComputeTextCharacteristics[i].text
    )).toEqual(testCasesComputeTextCharacteristics[i].result);
  });
}

const testCasesCreateHTMLMask = [
  {html: '', result: ''},
  {html: 'lorem ipsum', result: '11111111111'},
  {html: '<html>&#x3C;html&#x3E;<html>', result: '0000001111111111111111000000'},
  {html: 'foo<html>&#x3C;html&#x3E;<html><em>ba<b>r</b></em>batz', result: '111000000111111111111111100000000001100010000000001111'}
];

for (let i = 0; i < testCasesCreateHTMLMask.length; i++) {
  test('Does ' + testCasesCreateHTMLMask[i].html + ' return ' + testCasesCreateHTMLMask[i].result, () => {
    expect(TextProcessing.createHTMLMask(
      testCasesCreateHTMLMask[i].html,
    )).toBe(testCasesCreateHTMLMask[i].result);
  });
}

const testCasesGetMaskedText = [
  {html: '', mask: '', start: 0, result: ''},
  {html: '<html><html><html>', mask: '000000000000000000', start: 0, result: ''},
  {html: '<html><html><html>', mask: '000000111111000000', start: 0, result: '<html>'},
  {html: '<html><html><html>', mask: '000000111111000000', start: 7, end: 11, result: 'html'},
  {html: '<html><yada><html>', mask: '000000111111000000', start: 0, end: 19, result: '<yada>'},
];

for (let i = 0; i < testCasesGetMaskedText.length; i++) {
  test('Does ' + testCasesGetMaskedText[i].html + ' with ' + testCasesGetMaskedText[i].mask + ' (' + testCasesGetMaskedText[i].start + '/' + testCasesGetMaskedText[i].end + ') ' + ' return ' + testCasesGetMaskedText[i].result, () => {
    expect(TextProcessing.getMaskedText(
      testCasesGetMaskedText[i].html,
      testCasesGetMaskedText[i].mask,
      testCasesGetMaskedText[i].start,
      testCasesGetMaskedText[i].end
    )).toBe(testCasesGetMaskedText[i].result);
  });
}
