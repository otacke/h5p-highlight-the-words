// Import required classes
import HighlightTheWordsButton from './h5p-highlight-the-words-button';
import Util from './h5p-highlight-the-words-util';

/** Class representing the content */
export default class HighlightTheWordsTitlebar {
  /**
   * @constructor
   *
   * @param {object} params Parameter from editor.
   * @param {string} params.title Title.
   * @param {string} params.dateString Date.
   * @param {object} params.a11y Accessibility strings.
   * @param {string} params.a11y.buttonToggleActive Text for inactive button.
   * @param {string} params.a11y.buttonToggleInactive Text for inactive button.
   * @param {object} callbacks Callbacks.
   * @param {function} callbacks.handlebuttonToggle Handles click.
   */
  constructor(params, callbacks) {
    // Set missing params
    this.params = Util.extend({
      a11y: {
        buttonFullscreenEnter: 'Enter fullscreen mode',
        buttonFullscreenExit: 'Exit fullscreen mode'
      }
    }, params || {});

    // Set missing callbacks
    this.callbacks = Util.extend({
      onButtonMenuClicked: () => {
        console.warn('A function for handling the menu button is missing.');
      },
      onButtonFullscreenClicked: () => {
        console.warn('A function for handling the fullscreen button is missing.');
      },
      onColorChanged: () => {}
    }, callbacks || {});

    this.titleBar = document.createElement('div');
    this.titleBar.classList.add('h5p-highlight-the-words-title-bar');

    // Toggle button
    this.buttonMenu = new HighlightTheWordsButton(
      {
        type: 'toggle',
        classes: [
          'h5p-highlight-the-words-button',
          'h5p-highlight-the-words-button-menu'
        ],
        a11y: {
          active: this.params.a11y.buttonMenuClose,
          inactive: this.params.a11y.buttonMenuOpen
        }
      },
      {
        onClick: (() => {
          this.callbacks.onButtonMenuClicked();
        })
      }
    );

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

    // Fullscreen button
    this.buttonFullscreen = new HighlightTheWordsButton(
      {
        type: 'toggle',
        classes: [
          'h5p-highlight-the-words-button',
          'h5p-highlight-the-words-button-fullscreen'
        ],
        disabled: true,
        a11y: {
          active: this.params.a11y.buttonFullscreenExit,
          inactive: this.params.a11y.buttonFullscreenEnter
        }
      },
      {
        onClick: (() => {
          this.callbacks.onButtonFullscreenClicked();
        })
      }
    );

    this.titleBar.appendChild(this.buttonMenu.getDOM());
    this.titleBar.appendChild(this.colorPickerContainer);
    this.titleBar.appendChild(this.buttonFullscreen.getDOM());
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.titleBar;
  }

  /**
   * Enable fullscreen button.
   */
  enableFullscreenButton() {
    this.buttonFullscreen.enable();
  }

  /**
   * Set fullscreen button state.
   * @param {string|boolean} state enter|false for enter, exit|true for exit.
   */
  toggleFullscreenButton(state) {
    if (typeof state === 'string') {
      if (state === 'enter') {
        state = false;
      }
      else if (state === 'exit') {
        state = true;
      }
    }

    if (typeof state === 'boolean') {
      this.buttonFullscreen.toggle(state);
    }
  }

  handleColorChanged(target, color) {
    [...this.colorPickerContainer.childNodes].forEach(node => {
      node.classList.remove('h5p-highlight-the-words-selected');
    });
    target.classList.add('h5p-highlight-the-words-selected');

    this.callbacks.onColorChanged(color);
  }
}
