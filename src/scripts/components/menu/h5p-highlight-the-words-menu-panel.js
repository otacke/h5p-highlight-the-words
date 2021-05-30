// Import required classes
import Util from './../../h5p-highlight-the-words-util';
import './h5p-highlight-the-words-menu-panel.scss';

/** Class representing the content */
export default class HighlightTheWordsMenuPanel {
  /**
   * @constructor
   * @param {object} params Parameters.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params = {}, callbacks = {}) {
    // Set missing params
    this.params = Util.extend({
      a11y: {},
      classes: [],
      collapsible: true,
      expanded: false,
      label: '',
      passive: false
    }, params);

    if (this.params.passive) {
      this.params.collapsible = false;
    }

    if (!Array.isArray(this.params.classes)) {
      this.params.classes = [this.params.classes];
    }

    this.stateExpanded = false;

    // Sanitize callbacks
    this.callbacks = callbacks || {};
    this.callbacks.onClick = callbacks.onClick || (() => {});

    // Panel
    this.panel = document.createElement('div');
    this.panel.classList.add('h5p-highlight-the-words-panel');
    if (this.params.collapsible) {
      this.panel.classList.add('h5p-highlight-the-words-panel-collapsible');
    }
    if (this.params.menuItem) {
      this.panel.classList.add('h5p-highlight-the-words-panel-menu-item');
    }

    // Head
    this.panelHead = document.createElement('button');
    this.panelHead.classList.add('h5p-highlight-the-words-panel-head');
    this.panelHead.addEventListener('click', () => {
      this.handleClick();
    });

    this.disable();

    this.panel.appendChild(this.panelHead);

    if (this.params.collapsible) {
      this.stateIndicator = document.createElement('div');
      this.stateIndicator.classList.add('h5p-highlight-the-words-panel-state-indicator');
      this.panelHead.appendChild(this.stateIndicator);
    }

    const label = document.createElement('div');
    label.classList.add('h5p-highlight-the-words-panel-label');
    label.innerHTML = this.params.label;
    this.panelHead.appendChild(label);

    // Body
    this.panelBody = document.createElement('div');
    this.panelBody.classList.add('h5p-highlight-the-words-panel-body');
    this.panel.appendChild(this.panelBody);

    if (this.params.content) {
      this.setContent(this.params.content.getDOM());
    }

    if (this.params.classes) {
      this.params.classes.forEach((className) => {
        this.params.classList.add(className);
      });
    }

    if (this.params.expanded === true) {
      this.expand(true);
    }
    else {
      this.collapse(true);
    }

    if (this.params.passive === true) {
      this.disable(true);
    }
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.panel;
  }

  /**
   * Open.
   * @param {boolean} [force=false] Force expansion.
   */
  expand(force = false) {
    if (!force && !this.params.collapsible) {
      return;
    }

    this.panel.classList.add('h5p-highlight-the-words-panel-expanded');
    this.stateExpanded = true;
  }

  /**
   * Close.
   * @param {boolean} [force=false] Force collapse.
   */
  collapse(force = false) {
    if (!force && !this.params.collapsible) {
      return;
    }

    this.stateExpanded = false;
    this.panel.classList.remove('h5p-highlight-the-words-panel-expanded');
  }

  /**
   * Set active state.
   * @param {boolean} state If true, active, else inactive.
   */
  setActive(state) {
    if (state) {
      this.panel.classList.add('h5p-highlight-the-words-panel-active');
    }
    else {
      this.panel.classList.remove('h5p-highlight-the-words-panel-active');
    }
    this.stateActive = state;
  }

  /**
   * @param {boolean} [force=false] Force enable.
   */
  enable(force = false) {
    if (!force && this.params.passive) {
      return;
    }

    if (this.params.collapsible) {
      this.panelHead.setAttribute('tabIndex', 0);
    }

    this.panel.classList.remove('h5p-highlight-the-words-panel-disabled');
  }

  /**
   * Disable panel.
   * @param {boolean} [force=false] Force disable.
   */
  disable(force) {
    if (!force && this.params.passive) {
      return;
    }

    this.panelHead.setAttribute('tabIndex', -1);

    this.panel.classList.add('h5p-highlight-the-words-panel-disabled');
  }

  /**
   * Set content.
   * @param {HTMLElement} [content] Use as content, erase if nullish.
   */
  setContent(content) {
    this.panelBody.innerHTML = '';

    if (!content) {
      return;
    }

    this.panelBody.appendChild(content);
  }

  /**
   * Determine whether panel is expanded.
   * @return {boolean} True, if panel is expanded, else false.
   */
  isExpanded() {
    return this.stateExpanded;
  }

  handleClick() {
    if (this.params.passive) {
      return;
    }

    if (this.isExpanded()) {
      this.collapse();
    }
    else {
      this.expand();
    }

    this.callbacks.onClick(this);
  }
}
