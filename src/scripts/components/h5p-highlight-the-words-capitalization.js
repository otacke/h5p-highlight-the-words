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
    capitalizationWrapper.appendChild(this.createOptionElement({case: 'uppercase'}));
    capitalizationWrapper.appendChild(this.createOptionElement({case: 'lowercase'}));
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
    button.addEventListener('click', this.callbacks.onChosen);

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

    return wrapper;
  }

  /**
   * Return current state.
   * @return {object} Current state.
   */
  getCurrentState() {
    return {
      checked: this.checked
    };
  }
}
