// Import required classes
import Util from './h5p-highlight-the-words-util';

/** Class representing the content */
export default class HighlightTheWordsTitlebarColorPicker {
  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, callbacks) {
    // Set missing params
    this.params = Util.extend({
      highlightOptions: [],
      a11y: {
        colorFor: 'Color for @description',
        eraser: 'Erase selection'
      }
    }, params || {});

    this.params.highlightOptions.push({
      color: '',
      description: this.params.a11y.eraser
    });

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onColorChanged = this.callbacks.onColorChanged || (() => {});

    // Color picker
    this.colorPickerContainer = document.createElement('div');
    this.colorPickerContainer.classList.add('h5p-highlight-the-words-color-picker-container');

    this.params.highlightOptions.forEach((option, index) => {
      const picker = document.createElement('button');
      picker.classList.add('h5p-highlight-the-words-color-picker-button');

      // Select first picker
      if (index === 0) {
        picker.classList.add('h5p-highlight-the-words-selected');
        this.callbacks.onColorChanged(option.color);
      }

      // Set eraser
      if (option.color === '') {
        picker.classList.add('h5p-highlight-the-words-color-picker-eraser');
      }

      picker.setAttribute('aria-label', this.params.a11y.colorFor.replace(/@description/g, option.description));

      picker.style.backgroundColor = option.color;

      picker.addEventListener('click', (event) => {
        this.handleColorChanged(event.currentTarget, option.color);
      });

      this.colorPickerContainer.appendChild(picker);
    });
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.colorPickerContainer;
  }

  handleColorChanged(target, color) {
    [...this.colorPickerContainer.childNodes].forEach(node => {
      node.classList.remove('h5p-highlight-the-words-selected');
    });
    target.classList.add('h5p-highlight-the-words-selected');

    this.callbacks.onColorChanged(color);
  }
}
