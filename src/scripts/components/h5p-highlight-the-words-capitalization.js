// Import required classes
import Util from './../h5p-highlight-the-words-util';
import './h5p-highlight-the-words-capitalization.scss';

/** Class representing the content */
export default class HighlightTheWordsCapitalization {
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
      l10n: {
        uppercase: 'TODO: Uppercase',
        lowercase: 'TODO: Lowercase'
      },
      previousState: {}
    }, params);

    this.callbacks = Util.extend({
      onChosen: () => {}
    }, callbacks);

    this.buttons = {};

    // Required in case of multiple instances used as subcontent
    this.uuid = H5P.createUUID();

    this.capitalizationContainer = document.createElement('div');
    this.capitalizationContainer.classList.add('h5p-highlight-the-words-capitalization-container');

    const capitalizationWrapper = document.createElement('div');
    capitalizationWrapper.classList.add('h5p-highlight-the-words-capitalization-wrapper');
    this.capitalizationContainer.appendChild(capitalizationWrapper);

    const introduction = document.createElement('div');
    introduction.classList.add('h5p-highlight-the-words-capitalization-introduction');
    introduction.innerHTML = this.params.introduction;

    if (introduction !== '') {
      capitalizationWrapper.appendChild(introduction);
    }

    // Add buttons
    ['uppercase', 'lowercase'].forEach(charCase => {
      let wrapper;
      [wrapper, this.buttons[charCase]] = this.createOptionElement({case: charCase});
      capitalizationWrapper.appendChild(wrapper);
    });
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.capitalizationContainer;
  }

  createOptionElement(params) {
    const button = document.createElement('input');
    button.classList.add(`h5p-highlight-the-words-capitalization-radio-button`);
    button.classList.add(`h5p-highlight-the-words-capitalization-${params.case}`);
    button.setAttribute('type', 'radio');
    button.setAttribute('id', `h5p-highlight-the-words-capitalization-radio-button-${params.case}-${this.uuid}`);
    button.setAttribute('name', `h5p-highlight-the-words-capitalization-radio-button-group-${this.uuid}`);
    button.setAttribute('value', params.case);
    button.addEventListener('click', () => {
      this.handleChosen(params.case);
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
   * Handle click on radio buttons.
   * @param {string} charCase 'uppercase' or 'lowercase'.
   */
  handleChosen(charCase) {
    this.checked = charCase;
    this.callbacks.onChosen(charCase);
  }
}
