/** @constant {number} LUMA_RED Luminance factor for red channel */
const LUMA_RED = 0.2126;

/** @constant {number} LUMA_GREEN Luminance factor for green channel */
const LUMA_GREEN = 0.7152;

/** @constant {number} LUMA_BLUE Luminance factor for blue channel */
const LUMA_BLUE = 0.0722;

/** Class for utility functions */
class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @returns {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (typeof arguments[0][key] === 'object' && typeof arguments[i][key] === 'object') {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Retrieve true string from HTML encoded string.
   * @param {string} input Input string.
   * @returns {string} Output string.
   */
  static htmlDecode(input) {
    var dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent.replace(/(\r\n|\n|\r)/gm, '');
  }

  /**
   * Retrieve string without HTML tags.
   * @param {string} html Input string.
   * @returns {string} Output string.
   */
  static stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageCode Language tag.
   * @returns {string} Formatted language tag.
   */
  static formatLanguageCode(languageCode) {
    if (typeof languageCode !== 'string') {
      return languageCode;
    }

    /*
     * RFC 5646 states that language tags are case insensitive, but
     * recommendations may be followed to improve human interpretation
     */
    const segments = languageCode.split('-');
    segments[0] = segments[0].toLowerCase(); // ISO 639 recommendation
    if (segments.length > 1) {
      segments[1] = segments[1].toUpperCase(); // ISO 3166-1 recommendation
    }
    languageCode = segments.join('-');

    return languageCode;
  }

  /**
   * Check whether an HTML element is a child of the overlay.
   * @param {HTMLElement} node Node to check.
   * @param {HTMLElement} potentialParent Potential parent.
   * @returns {boolean} True, if element is a child.
   */
  static isChild(node, potentialParent) {
    const parent = node.parentNode;

    if (!parent) {
      return false;
    }

    if (parent === potentialParent) {
      return true;
    }

    return this.isChild(parent, potentialParent);
  }

  /**
   * Get n-th occurrence of indexOf in text.
   * @param {string} text Text to look in.
   * @param {string} pattern Pattern to look for.
   * @param {number} n N-th occurrence.
   * @returns {number} Index or -1 if not found.
   */
  static nthIndexOf(text, pattern, n) {
    if (typeof text !== 'string' || typeof pattern !== 'string') {
      return -1;
    }

    if (typeof n !== 'number' || n < 1) {
      n = 1;
    }

    let i = -1;

    while (n-- && i++ < text.length) {
      i = text.indexOf(pattern, i);
      if (i < 0) {
        break;
      }
    }

    return i;
  }

  /**
   * Compute text color (black/white) to given color as contrast.
   * @param {string} colorCode RGB color code in 6 char hex: #rrggbb.
   * @param {number} [threshold] Threshold in [0; 1] for black.
   * @returns {string} RGB contrast color code in 6 char hex: #rrggbb.
   */
  static computeTextColor(colorCode, threshold = 0.6) {
    if (typeof colorCode !== 'string' || !/#[0-9a-f]{6}/.test(colorCode)) {
      return null;
    }

    colorCode = colorCode.substring(1);

    // RGB as percentage
    const rgb = [
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(0, 2), 16) / 255,
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(2, 4), 16) / 255,
      // eslint-disable-next-line no-magic-numbers
      parseInt(colorCode.substring(4, 6), 16) / 255,
    ];

    // luma (Rec. 709, HDTV standard)
    const luma = LUMA_RED * rgb[0] + LUMA_GREEN * rgb[1] + LUMA_BLUE * rgb[2];

    return (luma > threshold) ? '#000000' : '#ffffff';
  }
}

export default Util;
