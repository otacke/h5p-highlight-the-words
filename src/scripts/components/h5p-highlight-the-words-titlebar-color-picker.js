// Import required classes
import Util from './../h5p-highlight-the-words-util.js';

import './h5p-highlight-the-words-titlebar-color-picker.scss';

/** Class representing the content */
export default class HighlightTheWordsTitlebarColorPicker {
  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, callbacks) {
    // Set missing params
    this.params = Util.extend({
      highlightOptions: [],
      a11y: {
        colorFor: 'Color for @description',
        eraser: 'Erase selection',
      },
    }, params || {});

    this.params.highlightOptions.push({
      color: '',
      backgroundColor: '',
      description: this.params.a11y.eraser,
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
        this.callbacks.onColorChanged({
          backgroundColor: option.backgroundColor,
          color: option.color,
        });
      }

      // Set eraser
      if (option.color === '') {
        picker.classList.add('h5p-highlight-the-words-color-picker-eraser');
      }

      picker.setAttribute('aria-label', this.params.a11y.colorFor.replace(/@description/g, option.description));

      picker.style.backgroundColor = option.backgroundColor;

      picker.addEventListener('click', (event) => {
        this.handleColorChanged(event.currentTarget, {
          backgroundColor: option.backgroundColor,
          color: option.color,
        });
      });

      this.colorPickerContainer.appendChild(picker);

      if (this.params.previousBackgroundColor === option.backgroundColor) {
        picker.click();
      }
    });
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.colorPickerContainer;
  }

  handleColorChanged(target, color) {
    Array.prototype.slice.call(this.colorPickerContainer.childNodes).forEach((node) => {
      node.classList.remove('h5p-highlight-the-words-selected');
    });
    target.classList.add('h5p-highlight-the-words-selected');

    this.callbacks.onColorChanged(color);
  }
}
