// Import required classes
import HighlightTheWordsMenuContent from './h5p-highlight-the-words-menu-content';
import './h5p-highlight-the-words-capitalization.scss';

/** Class representing the content */
export default class HighlightTheWordsCapitalization extends HighlightTheWordsMenuContent {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {object} [callbacks={}] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    super(params, callbacks);

    // Buttons
    this.buttons = {};

    // Required in case of multiple instances used as subcontent
    this.uuid = H5P.createUUID();

    // Add buttons
    ['uppercase', 'lowercase'].forEach(charCase => {
      let wrapper;
      [wrapper, this.buttons[charCase]] = this.createOptionElement({case: charCase});
      this.contentWrapper.appendChild(wrapper);
    });
  }

  /**
   * Set previous state.
   * @param {object} previousState Previous state.
   */
  setPreviousState(previousState) {
    this.checkButton(previousState);
  }

  /**
   * Reset.
   */
  reset() {
    this.uncheckAllButtons();
  }

  /**
   * Enable.
   */
  enable() {
    for (let id in this.buttons) {
      this.buttons[id].disabled = false;
    }
  }

  /**
   * Disable.
   */
  disable() {
    for (let id in this.buttons) {
      this.buttons[id].disabled = true;
    }
  }

  /**
   * Create option element.
   * @param {object} params Parameters.
   */
  createOptionElement(params) {
    const button = document.createElement('input');
    button.classList.add(`h5p-highlight-the-words-capitalization-radio-button`);
    button.classList.add(`h5p-highlight-the-words-capitalization-${params.case}`);
    button.setAttribute('type', 'radio');
    button.setAttribute('id', `h5p-highlight-the-words-capitalization-radio-button-${params.case}-${this.uuid}`);
    button.setAttribute('name', `h5p-highlight-the-words-capitalization-radio-button-group-${this.uuid}`);
    button.setAttribute('value', params.case);
    button.addEventListener('click', () => {
      this.handleChanged(params.case);
    });

    const label = document.createElement('label');
    label.classList.add('h5p-highlight-the-words-capitalization-label');
    label.classList.add(`h5p-highlight-the-words-capitalization-${params.case}`);
    label.setAttribute('for', `h5p-highlight-the-words-capitalization-radio-button-${params.case}-${this.uuid}`);
    label.innerText = this.params.l10n[params.case];

    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-highlight-the-words-capitalization-radio-button-wrapper');
    wrapper.classList.add(`h5p-highlight-the-words-capitalization-${params.case}`);
    wrapper.appendChild(button);
    wrapper.appendChild(label);

    return [wrapper, button, label];
  }

  /**
   * Check a button.
   * @param {string} charCase Id of button to set checked.
   */
  checkButton(charCase) {
    if (this.buttons[charCase]) {
      this.buttons[charCase].checked = true;
    }
  }

  /**
   * Uncheck a button.
   * @param {string} charCase Id of button to set unchecked.
   */
  uncheckButton(charCase) {
    if (this.buttons[charCase]) {
      this.buttons[charCase].checked = false;
    }
  }

  /**
   * Uncheck all buttons.
   */
  uncheckAllButtons() {
    for (let id in this.buttons) {
      this.uncheckButton(id);
    }
  }
}
