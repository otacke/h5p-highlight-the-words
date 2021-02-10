import HTMLDecoderEncoder from 'html-encoder-decoder';

/** Class for utility functions */
class TextProcessing {

  /**
   * Decode HTML from entities. Danger, Will Robinson!
   * @param {string} htmlEncoded HTML encoded string.
   * @return {string} Decoded HTML string.
   */
  static htmlDecode(htmlEncoded) {
    return HTMLDecoderEncoder.decode(htmlEncoded);
  }

  /**
   * Encode text into entities.
   * @param {string} html Text to be encoded.
   * @return {string} Encoded HTML string.
   */
  static htmlEncode(html) {
    return HTMLDecoderEncoder.encode(html);
  }

  /**
   * Encode html using mask telling what's not to be encoded.
   * @param {string} html HTML string to be encoded.
   * @param {string} mask Mask for html of 0 (don't encode) and 1 (encode).
   * @return {string} Encoded HTML according to mask.
   */
  static htmlEncodeMasked(html, mask) {
    while (mask.indexOf('01') !== -1) {
      const position = mask.indexOf('01');
      mask = `${mask.substring(0, position + 1)}${TextProcessing.DELIMITER}${mask.substring(position + 1)}`;
      html = `${html.substring(0, position + 1)}${TextProcessing.DELIMITER}${html.substring(position + 1)}`;
    }
    while (mask.indexOf('10') !== -1) {
      const position = mask.indexOf('10');
      mask = `${mask.substring(0, position + 1)}${TextProcessing.DELIMITER}${mask.substring(position + 1)}`;
      html = `${html.substring(0, position + 1)}${TextProcessing.DELIMITER}${html.substring(position + 1)}`;
    }

    html = html.split(TextProcessing.DELIMITER);
    mask = mask.split(TextProcessing.DELIMITER);

    return html
      .map((segment, index) => (mask[index].substr(0, 1) === '0') ? segment : this.htmlEncode(segment))
      .join('');
  }

  /**
   * Compute characteristics of text.
   * Assumes that text within in the argument text is HTML encoded, so it can be
   * distinguished from HTML.
   * Characteristics include text and mask of text (0 = HTML, 1 = text), same for
   * decoded text.
   * @param {string} text Mix of HTML and text where text is HTML encoded.
   * @return {object} Text characteristics.
   */
  static computeTextCharacteristics(text) {
    const encodedText = text;
    const encodedMask = this.createHTMLMask(text);

    // Split input text into segments of HTML and text
    let mask = encodedMask;
    while (mask.indexOf('01') !== -1) {
      const position = mask.indexOf('01');
      mask = `${mask.substring(0, position + 1)}${TextProcessing.DELIMITER}${mask.substring(position + 1)}`;
      text = `${text.substring(0, position + 1)}${TextProcessing.DELIMITER}${text.substring(position + 1)}`;
    }
    while (mask.indexOf('10') !== -1) {
      const position = mask.indexOf('10');
      mask = `${mask.substring(0, position + 1)}${TextProcessing.DELIMITER}${mask.substring(position + 1)}`;
      text = `${text.substring(0, position + 1)}${TextProcessing.DELIMITER}${text.substring(position + 1)}`;
    }
    text = text.split(TextProcessing.DELIMITER);
    mask = mask.split(TextProcessing.DELIMITER);

    // Build decoded variant of text and mask
    let decodedText = [];
    let decodedMask = [];

    mask.forEach((maskItem, index) => {
      if (maskItem.substr(0, 1) === '0') {
        decodedText.push(text[index]);
        decodedMask.push(Array(text[index].length + 1).join('0'));
      }
      else {
        const decoded = this.htmlDecode(text[index]);
        decodedText.push(decoded);
        decodedMask.push(Array(decoded.length + 1).join('1'));
      }
    });

    return {
      encodedText: encodedText,
      encodedMask: encodedMask,
      decodedText: decodedText.join(''),
      decodedMask: decodedMask.join('')
    };
  }

  /**
   * Get text content from masked HTML string.
   * @param {string} html HTML and text.
   * @param {string} mask Mask for html (0 = HTML, 1 = text).
   * @param {number} [start = 0] Start position in html.
   * @param {number} [end] End position in html.
   * @return {string} Text content of html from start to end.
   */
  static getMaskedText(html, mask, start = 0, end) {
    if (
      typeof html !== 'string' ||
      typeof mask !== 'string' ||
      html.length !== mask.length
    ) {
      return null;
    }

    if (typeof start !== 'number' || start < 0) {
      start = 0;
    }

    if (typeof end !== 'number' || end > html.length || end < start) {
      end = html.length;
    }

    let textContent = '';

    html = html.substring(start, end);
    mask = mask.substring(start, end);

    for (let i = 0; i < html.length; i++) {
      if (mask[i] === '1') {
        textContent = `${textContent}${html[i]}`;
      }
    }

    return textContent;
  }

  /**
   * Create mask for HTML to distinguish HTML tags from text.
   * @param {string} html HTML to get mask for.
   * @return {string} Mask consisting of 0 for HTML char and 1 for text content.
   */
  static createHTMLMask(html) {
    let maskHTML = '';
    let mode = 'text';

    while (html.length > 0) {
      if (mode === 'text') {
        if (html.substr(0, 1) !== '<') {
          maskHTML = `${maskHTML}1`;
          html = html.substr(1);
        }
        else {
          mode = 'html';
        }
      }
      else {
        if (html.substr(0, 1) === '>') {
          mode = 'text';
        }
        maskHTML = `${maskHTML}0`;
        html = html.substr(1);
      }
    }

    return maskHTML;
  }

  /**
   * Parse exercise text for selections to highlight.
   * @param {string} text Text.
   * @param {string[]} highlightNames Names of selection types.
   * @return {object} Text and selections to highlight.
   */
  static parseExerciseText(text, highlightNames) {
    let textOutput = '';
    const highlights = [];
    let position = 0;

    // Don't need &nbsp; from CKEditor
    text = text.replace(/&nbsp;/gm, ' ');

    while (text.length > 0) {

      // Check for starting *
      const matchPositionStart = this.indexOfUnescaped(text, '*');
      if (matchPositionStart === -1) {
        textOutput = `${textOutput}${text}`;
        break;
      }

      // Check for trailing * after starting *
      const matchPositionEnd = this.indexOfUnescaped(text, '*', matchPositionStart + 1);
      if (matchPositionEnd === -1) {
        textOutput = `${textOutput}${text}`;
        break;
      }

      // Check highlight text for name
      let highlightText = text.substring(matchPositionStart + 1, matchPositionEnd);
      const namePosition = this.indexOfUnescaped(highlightText, '::');

      if (namePosition === -1) {
        console.warn(`It seems that you forgot to add a name to the highlight text "${highlightText}"`);
        textOutput = `${textOutput}${text.substr(0, matchPositionStart)}${highlightText}`;
        text = text.substr(matchPositionEnd + 1);
        position = textOutput.length; // Don't forget previous runs
        continue;
      }

      // All clear, extract information and adjust text
      const name = highlightText.substr(namePosition + 2);

      highlightText = highlightText.substr(0, namePosition);

      // Replace \* with * inside highlightText
      while (this.indexOfUnescaped(highlightText, '\\::') !== -1) {
        const innerDoubleColon = this.indexOfUnescaped(highlightText, '\\::');
        highlightText = `${highlightText.substring(0, innerDoubleColon)}${highlightText.substring(innerDoubleColon + 1)}`;
      }

      // Replace \* with * inside highlightText
      while (this.indexOfUnescaped(highlightText, '\\*') !== -1) {
        const innerAsterisk = this.indexOfUnescaped(highlightText, '\\*');
        highlightText = `${highlightText.substring(0, innerAsterisk)}${highlightText.substring(innerAsterisk + 1)}`;
      }

      if (highlightNames.indexOf(name) === -1) {
        console.warn(`It seems that there is no specification for ${name}.`);
        textOutput = `${textOutput}${text.substr(0, matchPositionStart)}${highlightText}`;
        text = text.substr(matchPositionEnd + 1);
        position = textOutput.length; // Don't forget previous runs
        continue;
      }

      highlights.push({
        name: name,
        text: highlightText,
        start: position + matchPositionStart, // Accounting for removing the starting *
        end: position + matchPositionStart + highlightText.length // Accounting for removing the name and the trailing *
      });

      textOutput = `${textOutput}${text.substr(0, matchPositionStart)}${highlightText}`;

      text = text.substr(matchPositionEnd + 1);

      position = textOutput.length; // Don't forget previous runs
    }

    return {
      text: `${textOutput}`,
      highlights: highlights
    };
  }

  /**
   * Find index of next unescaped char.
   * @param {string} text Text to look in.
   * @param {string} char Char to look for.
   * @param {number} [start=0] Start position.
   * @return {number} Index of next unescaped char or -1.
   */
  static indexOfUnescaped(text, char, start = 0) {
    const position = text.indexOf(char, start);
    if (position === -1) {
      return -1;
    }

    const positionEscaped = text.indexOf(`\\${char}`, start);
    if (positionEscaped === -1 || positionEscaped + 1 !== position) {
      return position; // char is not escaped, position found
    }

    const positionEscapedEscape = text.indexOf(`\\\\${char}`, start);
    if (positionEscapedEscape === -1 || positionEscapedEscape + 1 !== positionEscaped) {
      const nextPosition = this.indexOfUnescaped(text, char, position + 1);
      return (nextPosition === -1) ? -1 : nextPosition;
    }
    else {
      return position - 1; // char is not escaped, position found
    }
  }
}

/** @constant {string} Delimiter for text */
TextProcessing.DELIMITER = '__DeLiMiTeR__';

export default TextProcessing;
