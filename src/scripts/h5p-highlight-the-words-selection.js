import Util from './h5p-highlight-the-words-util';
import "../styles/h5p-highlight-the-words.scss";

/** Class for utility functions */
export default class Selection {

  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {number} params.start Start position.
   * @param {number} params.end End position.
   * @param {string} [params.name] Name of selection class.
   * @param {string} [params.text] Selected text.
   * @param {object} [params.attributes] Custom attributes.
   * @param {string} [params.backgroundColor] Background color.
   * @param {string} [params.color] Color.
   * @param {number} [params.score] Score.
   */
  constructor(params = {}) {
    if (
      typeof params.start !== 'number' || params.start < 0 ||
      typeof params.end !== 'number' || params.end < params.start
    ) {
      console.warn('Could not create Selection');
      return;
    }

    // Assign variables
    ({
      start: this.start,
      end: this.end,
      name: this.name,
      text: this.text,
      attributes: this.attributes,
      backgroundColor: this.backgroundColor,
      color: this.color,
      score: this.score
    } = Util.extend({
      name: undefined,
      text: undefined,
      attributes: {},
      backgroundColor: undefined,
      color: '#000',
      score: 0
    }, params));

    this.active = false;
  }

  /**
   * Get name.
   * @return {string} Name.
   */
  getName() {
    return this.name;
  }

  /**
   * Set start position.
   * @param {number} start Start position.
   */
  setStart(start) {
    if (typeof start !== 'number' || start < 0) {
      return;
    }

    this.start = start;
  }

  /**
   * Get start position.
   * @return {number} Start position.
   */
  getStart() {
    return this.start;
  }

  /**
   * Set end position.
   * @param {number} end End position.
   */
  setEnd(end) {
    if (typeof end !== 'number' || end < this.getStart()) {
      return;
    }

    this.end = end;
  }

  /**
   * Get end position.
   * @return {number} End position.
   */
  getEnd() {
    return this.end;
  }

  /**
   * Set text.
   * @param {string} text Text.
   */
  setText(text) {
    if (typeof text !== 'string') {
      return;
    }

    this.text = text;
  }

  /**
   * Get text.
   * @return {string} Text.
   */
  getText() {
    return this.text;
  }

  /**
   * Set background color.
   * @param {string} backgroundColor Background color in CSS notation or ''.
   */
  setBackgroundColor(backgroundColor) {
    if (backgroundColor !== '' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(backgroundColor) === false) {
      return;
    }

    this.backgroundColor = backgroundColor;
  }

  /**
   * Get background color.
   * @return {string} Background color in CSS notation or ''.
   */
  getBackgroundColor() {
    return this.backgroundColor;
  }

  /**
   * Set color.
   * @param {string} color Color in CSS notation or ''.
   */
  setColor(color) {
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(color) === false) {
      return;
    }

    this.color = color;
  }

  /**
   * Get color.
   * @return {string} Color in CSS notation or ''.
   */
  getColor() {
    return this.color;
  }

  /**
   * Set score.
   * @param {number} score Score.
   */
  setScore(score) {
    if (typeof score !== 'number') {
      return;
    }

    this.score = score;
  }

  /**
   * Get score.
   * @return {number} Score.
   */
  getScore() {
    return this.score;
  }

  /**
   * Set attribute.
   * @param {string} id Attribute id.
   * @param {object|number|string|boolean|null} value Value to be stored.
   */
  setAttribute(id, value) {
    if (typeof id !== 'string' || typeof value === 'undefined') {
      return;
    }

    this.attributes[id] = value;
  }

  /**
   * Get attribute.
   * @return {object|number|string|boolean|null} Value that was stored.
   */
  getAttribute(id) {
    if (typeof id !== 'string') {
      return null;
    }

    return this.attributes[id];
  }

  /**
   * Remove attribute.
   * @param {string} id Id of attribute to be removed.
   */
  removeAttribute(id) {
    if (typeof id !== 'string') {
      return null;
    }

    delete this.attributes[id];
  }

  /**
   * Check whether contains attribute for an id.
   * @param {string} id Id to check for.
   * @return {boolean} True if contains attribute.
   */
  containsAttribute(id) {
    return typeof this.attributes[id] !== 'undefined';
  }

  /**
   * Set all attributes at once.
   * @param {object} attributes.
   */
  setAttributes(attributes) {
    if (typeof attributes !== 'object') {
      return;
    }

    this.attributes = attributes;
  }

  /**
   * Get all attributes.
   * @return {object} All attributes.
   */
  getAttributes() {
    return this.attributes;
  }

  /**
   * Get clone of selection.
   * @return {Selection} Clone of selection.
   */
  getClone() {
    return new Selection(this);
  }

  /**
   * Mark selection as active.
   */
  activate() {
    this.active = true;
  }

  /**
   * Mark selection as inactive.
   */
  deactivate() {
    this.active = false;
  }

  /**
   * Check whether selection is active.
   * @return {boolean} True if active.
   */
  isActive() {
    return this.active;
  }
}
