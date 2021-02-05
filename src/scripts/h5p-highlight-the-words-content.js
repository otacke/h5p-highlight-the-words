import HighlightTheWordsMenu from './components/h5p-highlight-the-words-menu';
import HighlightTheWordsTitlebar from './components/h5p-highlight-the-words-titlebar';
import HighlightTheWordsColorLegend from './components/h5p-highlight-the-words-color-legend';
import TextProcessing from './h5p-highlight-the-words-text-processing';
import SelectionHandler from './h5p-highlight-the-words-selection-handler';
import Util from './h5p-highlight-the-words-util';

/** Class representing the content */
export default class HighlightTheWordsContent {
  /**
   * @constructor
   */
  constructor(params = {}, callbacks = {}) {
    // TODO: Sanitize
    this.params = Util.extend({
      a11y: {},
      l10n: {}
    }, params);


    this.callbacks = callbacks;
    this.callbacks.onButtonFullscreenClicked = callbacks.onButtonFullscreenClicked || (() => {});
    this.callbacks.onResizeRequired = callbacks.onResizeRequired || (() => {});

    // TODO: This can be made nicer
    const foo = TextProcessing.processText(
      this.params.text,
      this.params.highlightOptions.map(option => option.name)
    );
    this.params.text = foo.text.replace(/(\r\n|\n|\r)/gm, '');
    this.solutions = foo.highlights;

    this.content = document.createElement('div');
    this.content.classList.add('h5p-highlight-the-words-content');

    // Page
    this.page = document.createElement('div');
    this.page.classList.add('h5p-highlight-the-words-page');

    // Menu
    this.menu = new HighlightTheWordsMenu({
      title: this.params.menuTitle,
      panelSet: {
        panels: [
          {
            id: 'colorLegend',
            options: {
              expanded: true,
              collapsible: false,
              label: this.params.l10n.colorLegend,
              content: new HighlightTheWordsColorLegend({
                options: this.params.highlightOptions
              }),
              passive: true
            },
          }
        ]
      }
    }, {
      onMenuToggled: this.callbacks.onResizeRequired,
      onItemChanged: (id) => {
        this.handleMenuItemChanged(id);
      }
    });

    // Excercise
    this.exercise = document.createElement('div');
    this.exercise.classList.add('h5p-highlight-the-words-exercise');

    // Task description
    if (this.params.taskDescription) {
      this.exercise.appendChild(this.buildTaskDescription(this.params.taskDescription));

      const ruler = document.createElement('div');
      ruler.classList.add('h5p-highlight-the-words-ruler');
      this.exercise.appendChild(ruler);
    }

    // Text container
    this.originalText = this.params.text;

    const textContainer = this.buildTextContainer(this.originalText);
    this.exercise.appendChild(textContainer);

    const ruler = document.createElement('div');
    ruler.classList.add('h5p-highlight-the-words-ruler');
    this.exercise.appendChild(ruler);

    // TODO: Clean up build process of content
    this.selectionHandler = new SelectionHandler(
      {
        text: this.params.text,
        textArea: this.textArea,
        solutions: this.solutions,
        highlightOptions: this.params.highlightOptions
      },
      {
        onTextUpdated: (html) => {
          this.handleTextUpdated(html);
        }
      }
    );

    this.selectionHandler.addSelectEventHandler(this.textArea);

    // Titlebar
    this.titlebar = new HighlightTheWordsTitlebar(
      {
        a11y: {
          buttonMenuOpen: this.params.a11y.buttonMenuOpen,
          buttonMenuClose: this.params.a11y.buttonMenuClose,
          buttonFullscreenEnter: this.params.a11y.buttonFullscreenEnter,
          buttonFullscreenExit: this.params.a11y.buttonFullscreenExit,
          colorFor: this.params.a11y.colorFor,
          eraser: this.params.a11y.eraser
        },
        highlightOptions: this.params.highlightOptions
      },
      {
        onColorChanged: (colors) => {
          this.handleColorChanged(colors);
        },
        onButtonMenuClicked: () => {
          this.handleMenuButtonClicked();
        },
        onButtonFullscreenClicked: this.callbacks.onButtonFullscreenClicked
      }
    );
    this.content.appendChild(this.titlebar.getDOM());
    this.content.appendChild(this.page);
    this.page.appendChild(this.menu.getDOM());
    this.page.appendChild(this.exercise);
  }

  /**
   * Return the DOM for this class.
   * @return {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.content;
  }

  /**
   * Return DOM for exercise element.
   * @return {HTMLElement} DOM for exercise element.
   */
  getExerciseDOM() {
    return this.exercise;
  }

  /**
   * Build task description.
   * @param {string} text Text.
   * @return {HTMLElement} Task description element.
   */
  buildTaskDescription(text) {
    const taskDescription = document.createElement('div');
    taskDescription.classList.add('h5p-highlight-the-words-task-description');
    taskDescription.innerHTML = text;

    return taskDescription;
  }

  /**
   * Build text container.
   * @param {string} text Text.
   * @return {HTMLElement} Text container element.
   */
  buildTextContainer(text) {
    const textContainer = document.createElement('div');
    textContainer.classList.add('h5p-highlight-the-words-text-container');

    // TODO: Don't define textArea here but outside of function
    this.textArea = document.createElement('div');
    this.textArea.classList.add('h5p-highlight-the-words-text');

    this.textArea.innerHTML = text;
    textContainer.appendChild(this.textArea);

    return textContainer;
  }

  /**
   * Disable.
   */
  disable() {
    this.selectionHandler.disable();
    this.textArea.classList.add('h5p-highlight-the-words-disabled');
  }

  /**
   * Enable.
   */
  enable() {
    this.selectionHandler.enable();
    this.textArea.classList.remove('h5p-highlight-the-words-disabled');
  }

  /**
   * Reset.
   */
  reset() {
    this.selectionHandler.removeSelections();
    this.updateTextContainer();
  }

  /**
   * Enable fullscreen button in titlebar.
   */
  enableFullscreenButton() {
    this.titlebar.enableFullscreenButton();
  }

  /**
   * Set dimensions to fullscreen.
   * @param {boolean} enterFullScreen If true, enter fullscreen, else exit.
   */
  toggleFullscreen(enterFullScreen = false) {
    this.titlebar.toggleFullscreenButton(enterFullScreen);
    this.menu.toggleFullscreen(enterFullScreen);

    if (enterFullScreen) {
      // Technically margin is missing, but should be fine.
      this.page.style.maxHeight = `${window.innerHeight - this.page.offsetTop}px`;
      this.page.style.height = this.page.style.maxHeight;
      this.page.style.overflowY = 'auto';
    }
    else {
      this.page.style.maxHeight = '';
      this.page.style.overflowY = '';
    }

    this.callbacks.onResizeRequired();
  }

  /**
   * Handle color changed.
   * @param {object} colors Colors to be used.
   * @param {object} colors.color Color to be used.
   * @param {object} colors.backgroundColor Background color to be used.
   */
  handleColorChanged(colors) {
    this.selectionHandler.setColors(colors);
  }

  /**
   * Handle menu button clicked.
   */
  handleMenuButtonClicked() {
    if (this.menu.isOpen()) {
      this.closeMenu();
    }
    else {
      this.openMenu();
    }
  }

  /**
   * Handle menu item changed.
   * @param {string} id Id of content.
   */
  handleMenuItemChanged(id) {
    // Handle menu item changes here
    let dummy = id;
    id = dummy;
  }

  /**
   * Handle text updated.
   * @param {string} html HTML to display in text area.
   */
  handleTextUpdated(html) {
    this.textArea.innerHTML = html;

    // Display score points if available
    const scorePoints = new H5P.Question.ScorePoints();

    const corrects = document.querySelectorAll('.h5p-highlight-the-words-correct');
    [...corrects].forEach(correct => {
      correct.appendChild(scorePoints.getElement(true));
    });

    const wrongs = document.querySelectorAll('.h5p-highlight-the-words-wrong');
    [...wrongs].forEach(correct => {
      correct.appendChild(scorePoints.getElement(false));
    });
  }

  /**
   * Open menu.
   */
  openMenu() {
    this.page.classList.add('h5p-highlight-the-words-menu-open');
    this.menu.open();
  }

  /**
   * Close menu.
   */
  closeMenu() {
    this.page.classList.remove('h5p-highlight-the-words-menu-open');
    this.menu.close();
  }

  /**
   * Get latest score.
   * @return {number} Latest score.
   */
  getScore() {
    const score = this.selectionHandler
      .getSelections()
      .reduce((sum, selection) => sum + selection.score, 0);

    return Math.max(0, score);
  }

  /**
   * Get maximum possible score.
   * @return {number} Maximum score possible.
   */
  getMaxScore() {
    return this.solutions.length;
  }

  /**
   * Update text container

   */
  updateTextContainer(mode) {
    this.selectionHandler.updateTextContainer(mode);
  }
}
