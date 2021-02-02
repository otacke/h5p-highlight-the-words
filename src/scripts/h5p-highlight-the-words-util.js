/** Class for utility functions */
class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @param {object} arguments Objects to be merged.
   * @return {object} Merged objects.
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
   * @return {string} Output string.
   */
  static htmlDecode(input) {
    var dparser = new DOMParser().parseFromString(input, 'text/html');
    return dparser.documentElement.textContent.replace(/(\r\n|\n|\r)/gm, '');
  }

  /**
   * Retrieve string without HTML tags.
   * @param {string} input Input string.
   * @return {string} Output string.
   */
  static stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageTag Language tag.
   * @return {string} Formatted language tag.
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
   * @return {boolean} True, if element is a child.
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

  static nthIndexOf(text, pattern, n) {
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
   * Compute text color to given color.
   * @param {string} colorCode RGB color code in 6 char hex: #rrggbb.
   * @param {number} [threshold=0.6] Threshold in [0; 1] for black.
   * @return {string} RGB contrast color code in 6 char hex: #rrggbb.
   */
  static computeTextColor(colorCode, threshold = 0.6) {
    if (typeof colorCode !== 'string' || !/#[0-9a-f]{6}/.test(colorCode)) {
      return null;
    }

    colorCode = colorCode.substr(1);

    // RGB as percentage
    const rgb = [
      parseInt(colorCode.substr(0, 2), 16) / 255,
      parseInt(colorCode.substr(2, 2), 16) / 255,
      parseInt(colorCode.substr(4, 2), 16) / 255
    ];

    // luma (Rec. 709, HDTV standard)
    const luma = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

    return (luma > threshold) ? '#000000' : '#ffffff';
  }
}

export default Util;
