// Import required classes
import HighlightTheWordsPanel from './h5p-highlight-the-words-menu-panel.js';
import Util from './../h5p-highlight-the-words-util.js';

/** Class representing the content */
export default class HighlightTheWordsMenuPanelSet {
  /**
   * @class
   * @param {object} params Parameters.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = Util.extend({
      panels: [],
    }, params);

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onClick = callbacks.onClick || (() => {});

    // TODO: Sanitize panels

    this.panels = {};

    this.panelset = document.createElement('div');
    this.panelset.classList.add('h5p-highlight-the-words-panel-set');

    this.params.panels.forEach((panel, index) => {
      this.panels[panel.id] = new HighlightTheWordsPanel(
        panel.options,
        {
          onClick: () => {
            this.handleClick(panel.id);
          },
        },
      );

      if (index === 0) {
        this.panels[panel.id].setActive(true);
      }

      this.panelset.appendChild(this.panels[panel.id].getDOM());
    });
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.panelset;
  }

  enable() {
    for (const id in this.panels) {
      this.panels[id].enable();
    }
  }

  disable() {
    for (const id in this.panels) {
      this.panels[id].disable();
    }
  }

  handleClick(clickId) {
    for (const id in this.panels) {
      if (id === clickId) {
        this.panels[id].setActive(true);
        if (this.panels[id].isExpanded()) {
          this.panels[id].expand();
        }
        else {
          this.panels[id].collapse();
        }
      }
      else {
        this.panels[id].setActive(false);
        this.panels[id].collapse();
      }
    }

    this.callbacks.onClick(clickId);
  }

  /**
   * Set dimensions to fullscreen.
   * @param {boolean} enterFullScreen If true, enter fullscreen, else exit.
   */
  setFixedHeight(enterFullScreen = false) {
    if (enterFullScreen) {
      // Technically margin is missing, but should be fine.
      this.panelset.style.maxHeight = `${window.innerHeight - this.panelset.offsetTop}px`;
      this.panelset.style.overflowY = 'auto';
    }
    else {
      this.panelset.style.maxHeight = '';
      this.panelset.style.overflowY = '';
    }
  }
}
