import HighlightTheWordsMenu from './components/h5p-highlight-the-words-menu';
import HighlightTheWordsTitlebar from './components/h5p-highlight-the-words-titlebar';
import HighlightTheWordsColorLegend from './components/h5p-highlight-the-words-color-legend';
import HighlightTheWordsCapitalization from './components/h5p-highlight-the-words-capitalization';
import TextProcessing from './h5p-highlight-the-words-text-processing';
import SelectionHandler from './h5p-highlight-the-words-selection-handler';
import Util from './h5p-highlight-the-words-util';

/** Class representing the content */
export default class HighlightTheWordsContent {
  /**
   * @constructor
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      a11y: {},
      l10n: {},
      highlightOptions: [],
      previousState: {}
    }, params);

    this.callbacks = Util.extend({
      onButtonFullscreenClicked: () => {},
      onResizeRequired: () => {},
      onInteracted: () => {}
    }, callbacks);

    // State for question type contract
    this.answerGiven = false;

    // Keep track of current selection
    this.currentSelection = null;

    this.params.text = this.params.text.replace(/(\r\n|\n|\r)/gm, '');

    // Parse exercise text for sections to be highlighted
    const parsedTextResults = TextProcessing.parseExerciseText(
      this.params.text,
      this.params.highlightOptions.map(option => option.name)
    );
    this.params.text = parsedTextResults.text.replace(/(\r\n|\n|\r)/gm, '');

    // Build solutions from parsed text results
    this.solutions = parsedTextResults.highlights.map(solution => {
      const highlightOption = this.params.highlightOptions
        .filter(option => option.name === solution.name)
        .shift();

      // Decode HTML entities to get real text + length
      solution.text = TextProcessing.htmlDecode(solution.text);
      solution.end = solution.start + solution.text.length;

      // Get colors from highlight options
      solution.backgroundColor = highlightOption.backgroundColor;
      solution.color = highlightOption.color;

      return solution;
    });
    this.solutions = SelectionHandler.recomputeSolutionPositions(this.solutions, this.params.text);

    this.content = document.createElement('div');
    this.content.classList.add('h5p-highlight-the-words-content');

    // Page
    this.page = document.createElement('div');
    this.page.classList.add('h5p-highlight-the-words-page');

    // Menu panels
    const menuPanels = [{
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
    }];

    // Add capitalization panel
    if (this.params.useCapitalization) {
      this.menuCapitalization = new HighlightTheWordsCapitalization(
        {
          introduction: this.params.l10n.capitalization.introduction,
          l10n: {
            uppercase: this.params.l10n.capitalization.labelUppercase,
            lowercase: this.params.l10n.capitalization.labelLowercase
          }
        },
        {
          onChosen: (charCase) => {
            this.handleCapitalizationChosen(charCase);
          }
        }
      );

      menuPanels.push({
        id: 'capitalization',
        options: {
          expanded: true,
          collapsible: false,
          label: this.params.l10n.capitalization.menuTitle,
          content: this.menuCapitalization,
          passive: true
        }
      });

      this.menuCapitalization.disable();
    }

    // Menu
    this.menu = new HighlightTheWordsMenu({
      title: this.params.menuTitle,
      panelSet: {
        panels: menuPanels
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

      // Visual separator
      const ruler = document.createElement('div');
      ruler.classList.add('h5p-highlight-the-words-ruler');
      this.exercise.appendChild(ruler);
    }

    // Text areas for exercise and solution
    const textAreasContainer = document.createElement('div');
    textAreasContainer.classList.add('h5p-highlight-the-words-text-areas-container');
    this.exercise.appendChild(textAreasContainer);

    // Exercise
    let [textContainer, textArea] = this.buildTextContainer(this.params.text);
    textAreasContainer.appendChild(textContainer);
    this.textArea = textArea;

    // Solution
    [textContainer, textArea] = this.buildTextContainer('');
    textContainer.classList.add('h5p-highlight-the-words-disabled');
    textContainer.classList.add('h5p-highlight-the-words-solution');
    textArea.classList.add('h5p-highlight-the-words-solution');
    textAreasContainer.appendChild(textContainer);

    this.textContainerSolution = textContainer;
    this.textAreaSolution = textArea;

    // Visual separator
    const ruler = document.createElement('div');
    ruler.classList.add('h5p-highlight-the-words-ruler');
    ruler.classList.add('h5p-highlight-the-words-margin-bottom');
    this.exercise.appendChild(ruler);

    // TODO: Clean up build process of content
    this.selectionHandler = new SelectionHandler(
      {
        text: this.params.text,
        textArea: this.textArea,
        exerciseArea: this.exercise,
        solutions: this.solutions,
        highlightOptions: this.params.highlightOptions,
        selections: this.params.previousState?.selections
      },
      {
        onTextUpdated: (html, mode) => {
          this.handleTextUpdated(html, mode);
        },
        onSelectionChanged: (selection) => {
          this.handleSelectionChanged(selection);
        },
        onInteracted: () => this.callbacks.onInteracted
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
        highlightOptions: this.params.highlightOptions,
        colors: this.params.previousState?.colors
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

    const textArea = document.createElement('div');
    textArea.classList.add('h5p-highlight-the-words-text');

    textArea.innerHTML = text;
    textContainer.appendChild(textArea);

    return [textContainer, textArea];
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
    this.updateTextContainer('reset');
    this.answerGiven = false;
    this.textContainerSolution.classList.add('h5p-highlight-the-words-disabled');
  }

  /**
   * Show solutions.
   */
  showSolution() {
    this.updateTextContainer('solution');
    setTimeout(() => { // Prevent flickering
      this.textContainerSolution.classList.remove('h5p-highlight-the-words-disabled');
    }, 0);
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

    this.setFixedHeight(enterFullScreen);

    this.callbacks.onResizeRequired();
  }

  /**
   * Fix height to current screen size.
   * @param {boolean} state If true, fix height.
   */
  setFixedHeight(state) {
    this.menu.setFixedHeight(state);

    if (state) {
      // Technically margin is missing, but should be fine.
      this.page.style.maxHeight = `${window.innerHeight - this.page.offsetTop}px`;
      this.page.style.height = this.page.style.maxHeight;
      this.page.style.overflowY = 'auto';
    }
    else {
      this.page.style.maxHeight = '';
      this.page.style.height = '';
      this.page.style.overflowY = '';
    }
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
   * Check if result has been submitted or input has been given.
   * @return {boolean} True, if answer was given.
   */
  getAnswerGiven() {
    return this.answerGiven;
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
   * Retrieve current state.
   * @return {object} Current state.
   */
  getCurrentState() {
    return {
      colors: this.currentColors,
      selections: this.selectionHandler.getSelections()
    };
  }

  /**
   * Get output text.
   * @param {string} mode Mode for output.
   */
  getOutput(mode) {
    return this.selectionHandler.getOutput(mode);
  }

  /**
   * Update text container
   * @param {string} [mode=null] Mode, scores|solution.
   */
  updateTextContainer(mode) {
    this.selectionHandler.updateTextContainer(mode);
  }

  /**
   * Handle color changed.
   * @param {object} colors Colors to be used.
   * @param {object} colors.color Color to be used.
   * @param {object} colors.backgroundColor Background color to be used.
   */
  handleColorChanged(colors) {
    this.currentColors = colors;
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
    // Handle menu item changes here (in the future)
    let dummy = id;
    id = dummy;
  }

  /**
   * Handle text updated.
   * @param {string} html HTML to display in text area.
   * @param {string} [mode=null] Mode, scores|solution.
   */
  handleTextUpdated(html, mode) {
    if (mode === 'reset') {
      this.textArea.innerHTML = html;
      this.textAreaSolution.innerHTML = '';
    }
    else if (mode === 'solution') {
      this.textAreaSolution.innerHTML = html;
    }
    else {
      this.textArea.innerHTML = html;
      this.answerGiven = true;
    }

    if (mode === 'scores') {
      // Display score points if available
      const scorePoints = new H5P.Question.ScorePoints();

      const corrects = this.textArea.querySelectorAll('.h5p-highlight-the-words-correct');
      Array.prototype.slice.call(corrects).forEach(correct => {
        correct.appendChild(scorePoints.getElement(true));
      });

      const wrongs = this.textArea.querySelectorAll('.h5p-highlight-the-words-wrong');
      Array.prototype.slice.call(wrongs).forEach(correct => {
        correct.appendChild(scorePoints.getElement(false));
      });
    }
  }

  /**
   * Handle text selected.
   */
  handleSelectionChanged(selection) {
    this.currentSelection = selection || null;

    if (!this.currentSelection) {
      this.menuCapitalization.uncheckAllButtons();
      this.menuCapitalization.disable();
      this.selectionHandler.deactivateAllSelections();
      return;
    }

    // TODO: Create separate class for Selection!!!
    if (selection?.attributes?.capitalization) {
      this.menuCapitalization.checkButton(selection.attributes.capitalization?.case);
    }
    else {
      this.menuCapitalization.uncheckAllButtons();
    }

    this.selectionHandler.activateSelection(selection.start);
    this.menuCapitalization.enable();

    this.callbacks.onInteracted();
  }

  /**
   * Handle capitalization for selection chosen.
   * @param {string} charCase Chosen case.
   */
  handleCapitalizationChosen(charCase) {
    if (this.currentSelection) {
      this.selectionHandler.setSelectionAttribute(
        this.currentSelection.start,
        'capitalization',
        {
          case: charCase
        }
      );
    }

    this.answerGiven = true;
    this.callbacks.onInteracted();
  }
}
