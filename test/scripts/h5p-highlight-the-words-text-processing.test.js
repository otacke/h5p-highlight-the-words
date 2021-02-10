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
