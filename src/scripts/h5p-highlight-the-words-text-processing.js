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
   * TODO: Get rid of this one
   */
  static recodeTextStructure(structure, encode) {
    if (encode !== 'encode' && encode !== 'decode') {
      return structure;
    }

    const segments = structure.segments.map(segment => {
      if (segment.isHtml) {
        return segment;
      }
      else {
        const recodedText = (encode === 'encode') ?
          this.htmlEncode(segment.text) :
          this.htmlDecode(segment.text);

        const newSegment = {
          isHtml: false,
          text: recodedText,
          length: recodedText.length
        };
        return newSegment;
      }
    });

    return {
      text: segments.map(segment => segment.text).join(''),
      mask: segments.map(segment => {
        const glue = (segment.isHtml) ? '0' : '1';
        return Array(segment.text.length + 1).join(glue);
      }).join(''),
      segments: segments
    };
  }

  /**
   * TODO: Get rid of this one
   */
  static buildTextStructure(html) {
    let mask = this.createHTMLMask(html);

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

    const segments = mask.map((maskItem, index) => {
      return {
        isHtml: maskItem.substr(0, 1) === '0',
        text: html[index],
        length: html[index].length
      };
    });

    return {
      text: html.join(''),
      mask: segments.map(segment => {
        const glue = (segment.isHtml) ? '0' : '1';
        return Array(segment.text.length + 1).join(glue);
      }).join(''),
      segments: segments
    };
  }

  /**
   * Get text content from masked HTML
   */
  static getMaskedText(html, mask, start, end) {
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
   * Extract plain text and selections to highlight.
   * TODO: Rename
   * @param {string} text (HTML) text.
   * @param {string[]} highlightNames Names of selection types.
   * @return {object} Text and selections to highlight.
   */
  static processText(text, highlightNames) {
    let textOutput = '';
    const highlights = [];
    let position = 0;

    // Don't need those from CKEditor
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
        continue;
      }

      // All clear, extract information and adjust text
      const name = highlightText.substr(namePosition + 2);

      highlightText = highlightText.substr(0, namePosition);
      if (highlightNames.indexOf(name) === -1) {
        console.warn(`It seems that there is no specification for ${name}.`);
        textOutput = `${textOutput}${text.substr(0, matchPositionStart)}${highlightText}`;
        text = text.substr(matchPositionEnd + 1);
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
      position += textOutput.length; // Don't forget previous runs
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
      const nextPosition = this.indexOfUnescaped(text.substr(position + 1), char, start);
      return (nextPosition === -1) ? -1 : position + nextPosition;
    }
    else {
      return position - 1; // char is not escaped, position found
    }
  }
}

TextProcessing.DELIMITER = '__DeLiMiTeR__';

export default TextProcessing;
