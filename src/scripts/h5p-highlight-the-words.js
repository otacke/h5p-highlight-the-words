// Import required classes
import HighlightTheWordsContent from './h5p-highlight-the-words-content';
import TextProcessing from './h5p-highlight-the-words-text-processing';
import Util from './h5p-highlight-the-words-util';

/**
 * Main class.
 */
export default class HighlightTheWords extends H5P.Question {
  /**
   * @constructor
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super('highlight-the-words'); // CSS class selector for content's iframe: h5p-hello-world

    this.params = params;
    this.contentId = contentId;
    this.extras = extras;

    /*
     * this.params.behaviour.enableSolutionsButton and this.params.behaviour.enableRetry
     * are used by H5P's question type contract.
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
     * @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
     */

    // Make sure all variables are set
    this.params = Util.extend({
      text: '<p>There is nothing to do here :-/</p>',
      highlightOptions: [],
      behaviour: {
        enableSolutionsButton: true,
        enableRetry: true
      },
      l10n: {
        checkAnswer: 'Check answer',
        showSolution: 'Show solution',
        tryAgain: 'Retry',
        colorDescriptions: 'Color descriptions'
      },
      a11y: {
        scoreBarLabel: 'You got :num out of :total points',
        buttonMenuOpen: 'Open menu',
        buttonMenuClose: 'Close menu',
        buttonFullscreenEnter: 'Enter fullscreen mode',
        buttonFullscreenExit: 'Exit fullscreen mode',
        colorFor: 'Color for @description',
        eraser: 'Erase selection'
      }
    }, this.params);

    // TODO: Sanitize input

    // Sanitize highlight options
    this.params.highlightOptions = this.params.highlightOptions
      .filter(option => {
        // Drop incomplete options
        const valid = (option.name && option.color);
        if (!valid) {
          console.warn(`${this.getTitle()}: Please check your highlight options. They contain incomplete entries.`);
        }
        return valid;
      })
      .map(option => {
        // Prepare for display
        option.description = Util.stripHTML(Util.htmlDecode(option.description || '&nbsp;'));
        return option;
      })
      .reduce((result, option) => {
        // Only allow same color once
        const colors = result.map(result => result.color);
        if (colors.indexOf(option.color) !== -1) {
          console.warn(`${this.getTitle()}: Please check your highlight options. They contain the same color multiple times.`);
          return result;
        }

        return [...result, option];
      }, []);

    // Set default language for xAPI
    const defaultLanguage = (extras.metadata) ? extras.metadata.defaultLanguage || 'en' : 'en';
    this.languageTag = Util.formatLanguageCode(defaultLanguage);

    // this.previousState now holds the saved content state of the previous session
    this.previousState = this.extras.previousState || {};

    const foo = TextProcessing.processText(
      this.params.text,
      this.params.highlightOptions.map(option => option.name)
    );

    /**
     * Register the DOM elements with H5P.Question
     */
    this.registerDomElements = () => {
      this.content = new HighlightTheWordsContent(
        {
          taskDescription: this.params.taskDescription,
          text: foo.text,
          highlightOptions: this.params.highlightOptions,
          a11y: {
            buttonMenuOpen: this.params.a11y.buttonMenuOpen,
            buttonMenuClose: this.params.a11y.buttonMenuClose,
            buttonFullscreenEnter: this.params.a11y.buttonFullscreenEnter,
            buttonFullscreenExit: this.params.a11y.buttonFullscreenExit,
            colorFor: this.params.a11y.colorFor,
            eraser: this.params.a11y.eraser
          },
          l10n: {
            colorDescriptions: this.params.l10n.colorDescriptions
          }
        },
        {
          onButtonFullscreenClicked: () => {
            this.toggleFullscreen();
          }
        }
      );

      // Register content with H5P.Question
      this.setContent(this.content.getDOM());

      // Register Buttons
      this.addButtons();

      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
          setTimeout(() => {
            // Add fullscreen button on first call after H5P.Question has created the DOM
            this.container = document.querySelector('.h5p-container');
            if (this.container) {
              this.content.enableFullscreenButton();

              this.on('enterFullScreen', () => {
                this.content.toggleFullscreen(true);
              });

              this.on('exitFullScreen', () => {
                this.content.toggleFullscreen(false);
              });

              // Reattach buttons to exercise container
              const questionButtons = document.querySelector('.h5p-question-buttons');
              const exercise = this.content.getExerciseDOM();
              exercise.appendChild(questionButtons);

              window.requestAnimationFrame(() => {
                this.trigger('resize');
              });
            }
          }, 0);
        }
      });
    };
  }

  /**
   * Add all the buttons that shall be passed to H5P.Question.
   */
  addButtons() {
    // Check answer button
    this.addButton('check-answer', this.params.l10n.checkAnswer, () => {
      // TODO: Implement something useful to do on click
      this.hideButton('check-answer');

      if (this.params.behaviour.enableSolutionsButton) {
        this.showButton('show-solution');
      }

      if (this.params.behaviour.enableRetry) {
        this.showButton('try-again');
      }
    }, true, {}, {});

    // Show solution button
    this.addButton('show-solution', this.params.l10n.showSolution, () => {
      // TODO: Implement something useful to do on click
    }, false, {}, {});

    // Retry button
    this.addButton('try-again', this.params.l10n.tryAgain, () => {
      this.showButton('check-answer');
      this.hideButton('show-solution');
      this.hideButton('try-again');

      this.resetTask();

      this.trigger('resize');
    }, false, {}, {});
  }

  /**
   * Check if result has been submitted or input has been given.
   *
   * @return {boolean} True, if answer was given.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
   */
  getAnswerGiven() {
    return false; // TODO: Return your value here
  }

  /**
   * Get latest score.
   *
   * @return {number} latest score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
  getScore() {
    return 0; // TODO: Return real score here
  }

  /**
   * Get maximum possible score.
   *
   * @return {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  getMaxScore() {
    return 0; // TODO: Return real maximum score here
  }

  /**
   * Show solutions.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
  showSolutions() {
    // TODO: Implement showing the solutions

    this.trigger('resize');
  }

  /**
   * Reset task.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    // TODO: Reset what needs to be reset
  }

  /**
   * Get xAPI data.
   *
   * @return {object} XAPI statement.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    return {
      statement: this.getXAPIAnswerEvent().data.statement
    };
  }

  /**
   * Build xAPI answer event.
   *
   * @return {H5P.XAPIEvent} XAPI answer event.
   */
  getXAPIAnswerEvent() {
    const xAPIEvent = this.createXAPIEvent('answered');

    xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this,
      true, this.isPassed());

    /*
     * TODO: Add other properties here as required, e.g. xAPIEvent.data.statement.result.response
     * https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#245-result
     */

    return xAPIEvent;
  }

  /**
   * Create an xAPI event for Dictation.
   *
   * @param {string} verb Short id of the verb we want to trigger.
   * @return {H5P.XAPIEvent} Event template.
   */
  createXAPIEvent(verb) {
    const xAPIEvent = this.createXAPIEventTemplate(verb);
    Util.extend(
      xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
      this.getxAPIDefinition());
    return xAPIEvent;
  }

  /**
   * Get the xAPI definition for the xAPI object.
   *
   * @return {object} XAPI definition.
   */
  getxAPIDefinition() {
    const definition = {};
    definition.name[this.languageTag] = this.getTitle();
    // Fallback for h5p-php-reporting, expects en-US
    definition.name['en-US'] = definition.name[this.languageTag];
    definition.description = {};
    definition.description[this.languageTag] = this.getDescription();
    // Fallback for h5p-php-reporting, expects en-US
    definition.description['en-US'] = definition.description[this.languageTag];

    // TODO: Set IRI as required for your verb, cmp. http://xapi.vocab.pub/verbs/#
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';

    // TODO: Set as required, cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#interaction-types
    definition.interactionType = 'other';

    /*
     * TODO: Add other object properties as required, e.g. definition.correctResponsesPattern
     * cmp. https://github.com/adlnet/xAPI-Spec/blob/master/xAPI-Data.md#244-object
     */

    return definition;
  }

  /**
   * Determine whether the task has been passed by the user.
   *
   * @return {boolean} True if user passed or task is not scored.
   */
  isPassed() {
    return true;
  }

  /**
   * Get tasks title.
   *
   * @return {string} Title.
   */
  getTitle() {
    let raw;
    if (this.extras.metadata) {
      raw = this.extras.metadata.title;
    }
    raw = raw || HighlightTheWords.DEFAULT_DESCRIPTION;

    // H5P Core function: createTitle
    return H5P.createTitle(raw);
  }

  /**
   * Get tasks description.
   *
   * @return {string} Description.
   */
  // TODO: Have a field for a task description in the editor if you need one.
  getDescription() {
    return this.params.taskDescription || HighlightTheWords.DEFAULT_DESCRIPTION;
  }

  /**
   * Answer call to return the current state.
   *
   * @return {object} Current state.
   */
  getCurrentState() {
    /*
     * TODO: Return any data object that will indicate the state that should
     * be loaded on start, here it's a random number
     */
    return {
      random: Math.random(100)
    };
  }

  /**
   * Toggle fullscreen button.
   * @param {string|boolean} state enter|false for enter, exit|true for exit.
   */
  toggleFullscreen(state) {
    if (!this.container) {
      return;
    }

    if (typeof state === 'string') {
      if (state === 'enter') {
        state = false;
      }
      else if (state === 'exit') {
        state = true;
      }
    }

    if (typeof state !== 'boolean') {
      state = !H5P.isFullscreen;
    }

    if (state === true) {
      H5P.fullScreen(H5P.jQuery(this.container), this);
    }
    else {
      H5P.exitFullScreen();
    }
  }
}

/** @constant {string} */
HighlightTheWords.DEFAULT_DESCRIPTION = 'Highlight the Words';
