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
      a11y: {}
    }, params || {});

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onColorChanged = this.callbacks.onColorChanged || (() => {});

    // Color picker
    this.colorPickerContainer = document.createElement('div');
    this.colorPickerContainer.classList.add('h5p-highlight-the-words-color-picker-container');

    const colors = ["#fce900", "#ea5725", "#e3000f", "#ed6ea7", "#9d74b1", "#009bb4", "#3ec0f0", "#85bd3f", ""];
    colors.forEach(color => {
      const picker = document.createElement('button');
      picker.classList.add('h5p-highlight-the-words-color-picker-button');
      picker.style.backgroundColor = color;
      if (color === '') {
        picker.classList.add('h5p-highlight-the-words-color-picker-eraser');
      }

      picker.addEventListener('click', (event) => {
        this.handleColorChanged(event.currentTarget, color);
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
