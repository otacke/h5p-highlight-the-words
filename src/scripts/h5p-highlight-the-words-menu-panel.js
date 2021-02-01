// Import required classes
import Util from './h5p-highlight-the-words-util';

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
      expanded: false,
      label: '',
      content: null,
      collapsable: true,
      classes: []
    }, params);

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

    // Head
    const panelHead = document.createElement('button');
    panelHead.classList.add('h5p-highlight-the-words-panel-head');
    if (this.params.collapsable) {
      panelHead.classList.add('h5p-highlight-the-words-panel-collapsable');
      panelHead.addEventListener('click', (event) => {
        this.handleClick(event.currentTarget);
      });
    }
    this.panel.appendChild(panelHead);

    if (this.params.collapsable) {
      this.stateIndicator = document.createElement('div');
      this.stateIndicator.classList.add('h5p-highlight-the-words-panel-state-indicator');
      panelHead.appendChild(this.stateIndicator);
    }

    const label = document.createElement('div');
    label.classList.add('h5p-highlight-the-words-panel-label');
    label.innerText = this.params.label;
    panelHead.appendChild(label);

    // Body
    this.panelBody = document.createElement('div');
    this.panelBody.classList.add('h5p-highlight-the-words-panel-body');
    this.panel.appendChild(this.panelBody);

    if (this.params.content) {
      this.setContent(this.params.content);
    }

    if (this.params.classes) {
      this.params.classes.forEach((className) => {
        this.params.classList.add(className);
      });
    }

    if (this.params.expand === true || !this.params.collapsable) {
      this.expand();
    }
    else {
      this.collapse();
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
   */
  expand() {
    this.panel.classList.add('h5p-highlight-the-words-panel-expanded');
    this.stateExpanded = true;
  }

  /**
   * Close.
   */
  collapse() {
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
      this.panel.classList.add('h5p-highlight-the-words-panel-remove');
    }
    this.stateActive = state;
  }

  /**
   * Set content.
   * @param {HTMLElement} [element] Use as content, erase if nullish.
   */
  setContent(element) {
    this.panelBody.innerHTML = '';

    if (!element) {
      return;
    }

    this.panelBody.appendChild(element);
  }

  /**
   * Determine whether menu is open.
   * @return {boolean} True, if menu is open, else false.
   */
  isExpanded() {
    return this.stateExpanded;
  }

  handleClick() {
    if (this.isExpanded()) {
      this.collapse();
    }
    else {
      this.expand();
    }

    this.callbacks.onClick(this);
  }
}
