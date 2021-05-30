// Import required classes
import Util from './../../h5p-highlight-the-words-util';
import HighlightTheWordsMenuContent from './h5p-highlight-the-words-menu-content';
import './h5p-highlight-the-words-color-legend.scss';

/** Class representing the content */
export default class HighlightTheWordsColorLegend extends HighlightTheWordsMenuContent {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   */
  constructor(params) {
    super(params);

    // Set missing params
    this.params = Util.extend({
      options: []
    }, this.params);

    // Add content
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

      this.contentWrapper.appendChild(colorDescription);
    });
  }
}
