// Import required classes
import HighlightTheWordsPanel from './h5p-highlight-the-words-menu-panel';
import Util from './h5p-highlight-the-words-util';

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
      l10n: {
        colorLegend: 'Color legend'
      },
      open: false,
      classes: []
    }, params);

    if (!Array.isArray(this.params.classes)) {
      this.params.classes = [this.params.classes];
    }

    this.stateOpen = false;

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onClick = callbacks.onClick || (() => {});

    // Menu
    this.menu = document.createElement('div');
    this.menu.classList.add('h5p-highlight-the-words-menu-container');
    this.menu.addEventListener('transitionend', () => {
      this.handleMenuTransitioned();
    });

    // Menu title
    const menuTitle = document.createElement('div');
    menuTitle.classList.add('h5p-highlight-the-words-menu-title-container');
    menuTitle.innerText = this.params.title;
    this.menu.appendChild(menuTitle);

    if (this.params.classes) {
      this.params.classes.forEach((className) => {
        this.menu.classList.add(className);
      });
    }

    this.menuWrapper = document.createElement('div');
    this.menuWrapper.classList.add('h5p-highlight-the-words-menu-wrapper');
    this.menu.appendChild(this.menuWrapper);

    // TODO: Create panel manager
    this.colorPanel = new HighlightTheWordsPanel({
      expand: true,
      collapsible: false,
      label: this.params.l10n.colorLegend
    });
    this.colorPanel.setActive(true);
    this.menuWrapper.appendChild(this.colorPanel.getDOM());

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

  // TODO: True panel management
  setPanelContent(content) {
    this.colorPanel.setContent(content);
  }

  handleMenuTransitioned() {
    if (this.isOpen()) {
      this.colorPanel.enable();
    }
    else {
      this.colorPanel.disable();
    }
  }

  /**
   * Set dimensions to fullscreen.
   * @param {boolean} enterFullScreen If true, enter fullscreen, else exit.
   */
  toggleFullscreen(enterFullScreen = false) {
    if (enterFullScreen) {
      // Technically margin is missing, but should be fine.
      this.menuWrapper.style.maxHeight = `${window.innerHeight - this.menuWrapper.offsetTop}px`;
      this.menuWrapper.style.overflowY = 'auto';
    }
    else {
      this.menuWrapper.style.maxHeight = '';
      this.menuWrapper.style.overflowY = '';
    }
  }
}
