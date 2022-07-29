// Import required classes
import HighlightTheWordsContent from './h5p-highlight-the-words-content';
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
    super('highlight-the-words'); // CSS class selector for content's iframe

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
        colorLegend: 'Color legend'
      },
      a11y: {
        buttonMenuOpen: 'Open menu',
        buttonMenuClose: 'Close menu',
        buttonFullscreenEnter: 'Enter fullscreen mode',
        buttonFullscreenExit: 'Exit fullscreen mode',
        colorFor: 'Color for @description',
        eraser: 'Erase selection',
        checkAnswer: 'Check the selections. The selections will be marked as correct or incorrect.',
        showSolution: 'Show the solution. The solution will be displayed in addition to the selections.',
        retry: 'Retry the task. Reset all selections and start the task over again.',
        yourResult: 'You got @score out of @total points.'
      }
    }, this.params);

    // Sanitize a11y and l10n
    for (let phrase in this.params.a11y) {
      this.params.a11y[phrase] = Util.stripHTML(Util.htmlDecode(this.params.a11y[phrase]));
    }
    for (let phrase in this.params.l10n) {
      this.params.l10n[phrase] = Util.stripHTML(Util.htmlDecode(this.params.l10n[phrase]));
    }

    // Sanitize highlight options
    this.params.highlightOptions = this.params.highlightOptions
      .filter(option => {
        // Drop incomplete options
        const valid = (option.name && option.backgroundColor);
        if (!valid) {
          console.warn(`${this.getTitle()}: Please check your highlight options. They contain incomplete entries.`);
        }
        return valid;
      })
      .map(option => {
        // Prepare for display
        option.description = Util.stripHTML(Util.htmlDecode(option.description || '&nbsp;'));
        option.color = Util.computeTextColor(option.backgroundColor);
        return option;
      })
      .reduce((result, option) => {
        // Only allow same color once
        const colors = result.map(result => result.backgroundColor);
        if (colors.indexOf(option.backgroundColor) !== -1) {
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
  }

  /**
   * Register the DOM elements with H5P.Question
   */
  registerDomElements() {
    this.content = new HighlightTheWordsContent(
      {
        taskDescription: this.params.taskDescription,
        text: this.params.text,
        menuTitle: this.getTitle(),
        highlightOptions: this.params.highlightOptions,
        previousState: this.previousState,
        a11y: {
          buttonMenuOpen: this.params.a11y.buttonMenuOpen,
          buttonMenuClose: this.params.a11y.buttonMenuClose,
          buttonFullscreenEnter: this.params.a11y.buttonFullscreenEnter,
          buttonFullscreenExit: this.params.a11y.buttonFullscreenExit,
          colorFor: this.params.a11y.colorFor,
          eraser: this.params.a11y.eraser
        },
        l10n: {
          colorLegend: this.params.l10n.colorLegend
        }
      },
      {
        onButtonFullscreenClicked: () => {
          this.handleFullscreenClicked();
        },
        onResizeRequired: () => {
          this.handleResizeRequired();
        },
        onInteracted: () => {
          this.handleInteracted();
        }
      }
    );

    // Register content with H5P.Question
    this.setContent(this.content.getDOM());

    // Register feedback/scorebar so we can re-attach it elsewhere
    this.setFeedback('', 0, this.getMaxScore());

    // Register Buttons
    this.addButtons();

    // Wait for content DOM to be completed
    if (document.readyState === 'complete') {
      this.handleInitialized();
    }
    else {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'complete') {
          this.handleInitialized();
        }
      });
    }

    // Resize fullscreen dimensions when rotating screen
    window.addEventListener('orientationchange', () => {
      if (H5P.isFullscreen) {
        setTimeout(() => { // Needs time to get into fullscreen for window.innerHeight
          this.content.setFixedHeight(true);
        }, 100);
      }
    }, false);
  }

  /**
   * Add all buttons that shall be passed to H5P.Question.
   */
  addButtons() {
    // Check answer button
    this.addButton('check-answer', this.params.l10n.checkAnswer, () => {
      this.handleCheckAnswer();
    }, true, {
      'aria-label': this.params.a11y.checkAnswer
    }, {});

    // Show solution button
    this.addButton('show-solution', this.params.l10n.showSolution, () => {
      this.handleShowSolution();
    }, false, {
      'aria-label': this.params.a11y.showSolution
    }, {});

    // Retry button
    this.addButton('try-again', this.params.l10n.tryAgain, () => {
      this.handleRetry();
    }, false, {
      'aria-label': this.params.a11y.retry
    }, {});
  }

  /**
   * Check if result has been submitted or input has been given.
   * @return {boolean} True, if answer was given.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-1}
   */
  getAnswerGiven() {
    return this.content.getAnswerGiven();
  }

  /**
   * Get latest score.
   * @return {number} Latest score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
  getScore() {
    return this.content.getScore();
  }

  /**
   * Get maximum possible score.
   * @return {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  getMaxScore() {
    this.maxScore = this.maxScore || this.content.getMaxScore();
    return this.maxScore;
  }

  /**
   * Show solutions.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
  showSolutions() {
    this.content.disable();
    this.content.showSolution();

    this.trigger('resize');
  }

  /**
   * Reset task.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    this.removeFeedback();
    this.content.reset();
    this.content.enable();
  }

  /**
   * Get xAPI data.
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
   * @return {H5P.XAPIEvent} XAPI answer event.
   */
  getXAPIAnswerEvent() {
    const xAPIEvent = this.createXAPIEvent('answered');

    xAPIEvent.setScoredResult(this.getScore(), this.getMaxScore(), this,
      true, this.isPassed());

    return xAPIEvent;
  }

  /**
   * Create an xAPI event.
   * @param {string} verb Short id of the verb we want to trigger.
   * @return {H5P.XAPIEvent} Event template.
   */
  createXAPIEvent(verb) {
    const xAPIEvent = this.createXAPIEventTemplate(verb);
    Util.extend(
      xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
      this.getxAPIDefinition());

    // Regular xAPI interaction types don't fit
    xAPIEvent.data.statement.context.extensions = {};
    Util.extend(
      xAPIEvent.getVerifiedStatementValue(['context', 'extensions']),
      this.getxAPIContextExtensions());

    return xAPIEvent;
  }

  /**
   * Get the xAPI definition for the xAPI object.
   * @return {object} XAPI definition.
   */
  getxAPIDefinition() {
    const definition = {};

    definition.name = {};
    definition.name[this.languageTag] = this.getTitle();
    // Fallback for h5p-php-reporting, expects en-US
    definition.name['en-US'] = definition.name[this.languageTag];

    definition.description = {};
    definition.description[this.languageTag] = this.getDescription();
    // Fallback for h5p-php-reporting, expects en-US
    definition.description['en-US'] = definition.description[this.languageTag];

    // Regular xAPI interaction types don't fit
    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'other';
    definition.extensions = {
      'https://h5p.org/x-api/h5p-machine-name': 'H5P.HighlightTheWords'
    };

    return definition;
  }

  /**
   * Get the xAPI context extensions.
   * @return {object} XAPI contextExtensions.
   */
  getxAPIContextExtensions() {
    return {
      result: this.content.getOutput('xapi-result'),
      solution: this.content.getOutput('xapi-solution')
    };
  }

  /**
   * Determine whether the task has been passed by the user.
   * @return {boolean} True if user passed or task is not scored.
   */
  isPassed() {
    return this.getScore() >= this.getMaxScore();
  }

  /**
   * Get tasks title.
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
   * @return {string} Description.
   */
  getDescription() {
    return this.params.taskDescription || HighlightTheWords.DEFAULT_DESCRIPTION;
  }

  /**
   * Answer call to return the current state.
   *
   * @return {object} Current state.
   */
  getCurrentState() {
    return this.content.getCurrentState();
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

  /**
   * Handle check answer button
   */
  handleCheckAnswer() {
    this.hideButton('check-answer');

    if (this.params.behaviour.enableSolutionsButton) {
      this.showButton('show-solution');
    }

    if (this.params.behaviour.enableRetry) {
      this.showButton('try-again');
    }

    this.content.disable();
    this.content.updateTextContainer('scores');

    const textScore = H5P.Question.determineOverallFeedback(
      this.params.overallFeedback, this.getScore() / this.getMaxScore());

    // Output via H5P.Question
    const ariaMessage = (this.params.a11y.yourResult || '@score / @total')
      .replace('@score', this.getScore())
      .replace('@total', this.getMaxScore());

    this.setFeedback(
      (textScore).trim(),
      this.getScore(),
      this.getMaxScore(),
      ariaMessage
    );

    this.trigger(this.getXAPIAnswerEvent());
  }

  /**
   * Handle show solution button
   */
  handleShowSolution() {
    this.hideButton('show-solution');

    this.showSolutions();
  }

  /**
   * Handle retry button
   */
  handleRetry() {
    this.showButton('check-answer');
    this.hideButton('show-solution');
    this.hideButton('try-again');

    this.resetTask();

    this.trigger('resize');
  }

  /**
   * Handle content initialized
   */
  handleInitialized() {
    // Hide temporary feedback
    this.removeFeedback();

    setTimeout(() => {
      // Add fullscreen button on first call after H5P.Question has created the DOM
      this.container = document.querySelector('.h5p-container');
      if (this.container) {
        
        if (this.isRoot()) {
          this.content.enableFullscreenButton();

          this.on('enterFullScreen', () => {
            setTimeout(() => { // Needs time to get into fullscreen for window.innerHeight
              this.content.toggleFullscreen(true);
            }, 100);
          });
        }
        
        this.on('exitFullScreen', () => {
          this.content.toggleFullscreen(false);
        });

        // Reattach H5P.Question containers to exercise
        const exercise = this.content.getExerciseDOM();
        const questionFeedback = document.querySelector('.h5p-question-feedback');
        exercise.appendChild(questionFeedback);
        questionFeedback.classList.remove('h5p-question-visible');

        const questionScorebar = document.querySelector('.h5p-question-scorebar');
        exercise.appendChild(questionScorebar);
        questionScorebar.classList.remove('h5p-question-visible');

        const questionButtons = document.querySelector('.h5p-question-buttons');
        exercise.appendChild(questionButtons);

        window.requestAnimationFrame(() => {
          questionFeedback.classList.add('h5p-highlight-the-words-initialized');
          questionScorebar.classList.add('h5p-highlight-the-words-initialized');
          questionButtons.classList.add('h5p-highlight-the-words-initialized');

          this.trigger('resize');
        });
      }
    }, 150); // Required for feedback and scorbar to be gone again
  }

  /**
   * Handle fullscreen button clicked.
   */
  handleFullscreenClicked() {
    this.toggleFullscreen();
  }

  /**
   * Handle resize required by components.
   */
  handleResizeRequired() {
    this.trigger('resize');
  }

  /**
   * Handle user interacted.
   */
  handleInteracted() {
    this.triggerXAPI('interacted');
  }
}

/** @constant {string} */
HighlightTheWords.DEFAULT_DESCRIPTION = 'Highlight the Words';
