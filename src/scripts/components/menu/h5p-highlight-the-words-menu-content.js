// Import required classes
import Util from './../../h5p-highlight-the-words-util';
import './h5p-highlight-the-words-menu-content.scss';

/** Class representing the content */
export default class HighlightTheWordsMenuContent {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {object} [callbacks={}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = Util.extend({
      introduction: '',
      l10n: {},
      previousState: {}
    }, params);

    this.callbacks = Util.extend({
      onChanged: () => {}
    }, callbacks);

    this.state = this.params.previousState;

    this.content = document.createElement('div');
    this.content.classList.add('h5p-highlight-the-words-menu-content-container');

    this.contentWrapper = document.createElement('div');
    this.contentWrapper.classList.add('h5p-highlight-the-words-menu-content-wrapper');
    this.content.appendChild(this.contentWrapper);

    const introduction = document.createElement('div');
    introduction.classList.add('h5p-highlight-the-words-menu-content-introduction');
    introduction.innerHTML = this.params.introduction;

    if (introduction !== '') {
      this.contentWrapper.appendChild(introduction);
    }
  }

  /**
   * Set content.
   * @param {HTMLElement} content.
   */
  setContent(content) {
    if (typeof content !== 'object') {
      return;
    }

    this.contentWrapper.innerHTML = '';
    this.contentWrapper.appendChild(content);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Get current state.
   * @return {object} state.
   */
  getCurrentState() {
    return this.state;
  }

  /**
   * Set previous state.
   * @param {object} previousState Previous state.
   */
  setPreviousState(previousState) {
    // Needs to be implemented
    this.state = previousState;
  }

  /**
   * Reset.
   */
  reset() {
    // Needs to be implemented
  }

  /**
   * Enable.
   */
  enable() {
    // Needs to be implemented
  }

  /**
   * Disable.
   */
  disable() {
    // Needs to be implemented
  }

  /**
   * Handle state changed.
   * @param {object} state State.
   */
  handleChanged(state) {
    this.state = state;
    this.callbacks.onChanged(this.getCurrentState());
  }
}
