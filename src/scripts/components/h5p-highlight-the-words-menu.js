// Import required classes
import HighlightTheWordsPanelSet from './h5p-highlight-the-words-menu-panel-set';
import Util from './../h5p-highlight-the-words-util';
import './h5p-highlight-the-words-menu.scss';

/** Class representing the content */
export default class HighlightTheWordsMenu {
  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = Util.extend({
      title: 'Menu',
      a11y: {},
      l10n: {},
      open: false,
      classes: []
    }, params);

    if (!Array.isArray(this.params.classes)) {
      this.params.classes = [this.params.classes];
    }

    this.stateOpen = false;

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onMenuToggled = callbacks.onMenuToggled || (() => {});
    this.callbacks.onItemChanged = callbacks.onItemChanged || (() => {});

    // Menu
    this.menu = document.createElement('div');
    this.menu.classList.add('h5p-highlight-the-words-menu-container');
    this.menu.addEventListener('transitionend', () => {
      this.handleMenuTransitioned();
    });

    if (this.params.classes) {
      this.params.classes.forEach((className) => {
        this.menu.classList.add(className);
      });
    }

    // Menu title
    const menuTitle = document.createElement('div');
    menuTitle.classList.add('h5p-highlight-the-words-menu-title-container');
    menuTitle.innerHTML = this.params.title;
    this.menu.appendChild(menuTitle);

    this.panelSet = new HighlightTheWordsPanelSet(
      {
        panels: this.params.panelSet.panels
      },
      {
        onClick: this.callbacks.onItemChanged
      }
    );
    this.menu.appendChild(this.panelSet.getDOM());

    if (this.params.open === true) {
      this.open();
    }
    else {
      this.close();
    }
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.menu;
  }

  /**
   * Open.
   */
  open() {
    this.menu.classList.add('h5p-highlight-the-words-menu-open');
    this.stateOpen = true;
  }

  /**
   * Close.
   */
  close() {
    this.stateOpen = false;
    this.menu.classList.remove('h5p-highlight-the-words-menu-open');
  }

  /**
   * Determine whether menu is open.
   * @return {boolean} True, if menu is open, else false.
   */
  isOpen() {
    return this.stateOpen;
  }

  /**
   * Handle menu transition in DOM.
   */
  handleMenuTransitioned() {
    if (!this.panelSet) {
      return;
    }

    // Enable/disable panel set to prevent tabbing into it
    if (this.isOpen()) {
      this.panelSet.enable();
    }
    else {
      this.panelSet.disable();
    }

    this.callbacks.onMenuToggled(this.isOpen());
  }

  /**
   * Set dimensions to fullscreen.
   * @param {boolean} enterFullScreen If true, enter fullscreen, else exit.
   */
  setFixedHeight(enterFullScreen = false) {
    this.panelSet.setFixedHeight(enterFullScreen);
  }
}
