// Import required classes
import Util from './../h5p-highlight-the-words-util';
import './h5p-highlight-the-words-color-legend.scss';

/** Class representing the content */
export default class HighlightTheWordsColorLegend {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   */
  constructor(params) {
    // Set missing params
    this.params = Util.extend({
      options: [],
      classes: []
    }, params || {});

    if (!Array.isArray(this.params.classes)) {
      this.params.classes = [this.params.classes];
    }

    this.colorLegendContainer = document.createElement('div');
    this.colorLegendContainer.classList.add('h5p-highlight-the-words-color-legend-container');

    if (this.params.classes) {
      this.params.classes.forEach((className) => {
        this.colorLegendContainer.classList.add(className);
      });
    }

    const colorLegendWrapper = document.createElement('div');
    colorLegendWrapper.classList.add('h5p-highlight-the-words-color-legend-wrapper');
    this.colorLegendContainer.appendChild(colorLegendWrapper);

    this.params.options.forEach(option => {
      const colorDescription = document.createElement('div');
      colorDescription.classList.add('h5p-highlight-the-words-color-description');

      const colorField = document.createElement('div');
      colorField.classList.add('h5p-highlight-the-words-color-field');
      colorField.style.backgroundColor = option.backgroundColor;
      colorDescription.appendChild(colorField);

      const colorLabel = document.createElement('div');
      colorLabel.classList.add('h5p-highlight-the-words-color-label');
      colorLabel.innerHTML = option.description;
      colorDescription.appendChild(colorLabel);

      colorLegendWrapper.appendChild(colorDescription);
    });
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.colorLegendContainer;
  }
}
