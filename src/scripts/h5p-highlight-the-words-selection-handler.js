import Util from './h5p-highlight-the-words-util';
import TextProcessing from './h5p-highlight-the-words-text-processing';

/** Class for selections functions */
class SelectionHandler {
  /**
   * @constructor
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      text: '',
      highlightOptions: [],
      solutions: []
    }, params);

    this.callbacks = callbacks || {};
    this.callbacks.onTextUpdated = callbacks.onTextUpdated || (() => {});

    // Mapping for getting option name for color given.
    this.colorToNameLookup = {};
    this.params.highlightOptions.forEach(option => {
      this.colorToNameLookup[option.backgroundColor] = option.name;
    });

    // Create decoded text and masks from encoded text
    this.textCharacteristics = TextProcessing.computeTextCharacteristics(params.text);
    this.selectMin = this.textCharacteristics.decodedMask.indexOf('1');
    this.selectMax = this.textCharacteristics.decodedMask.lastIndexOf('1') + 1;

    // Current selections in text
    this.selections = params.selections || [];

    // Current selection to be checked
    this.pendingSelection = null;

    // Listener for changes
    this.selectionChangedListener = null;

    // Timestamp to keep track of spam clicking
    this.lastSelectStart = null;

    // State for being disabled
    this.disabled = false;

    this.addSelectEventHandler();

    // Restore previous state
    if (this.selections.length > 0) {
      this.updateTextContainer();
    }

    // Prevent selecting paragraphs by triple clicks
    this.params.textArea.addEventListener('click', event => {
      if (event.detail === 3) {
        this.clearSelections();
      }
    });
  }

  /**
   * Disable.
   */
  disable() {
    this.disabled = true;
  }

  /**
   * Enable.
   */
  enable() {
    this.disabled = false;
  }

  /**
   * Get selections.
   * @return {object} Selections.
   */
  getSelections() {
    return this.selections || [];
  }

  /**
   * Set currently active colors.
   */
  setColors(colors) {
    this.currentSelectColors = colors;
  }

  /**
   * Find selection.
   * @param {number} position Position in text.
   * @return {object} Selection. Can only be one since no overlaps are allowed.
   */
  findSelection(position) {
    return this.selections
      .filter(selection => selection.start <= position && selection.end > position)
      .shift();
  }

  /**
   * Add selection.
   * @param {object} params Parameters.
   * @param {number} params.start Start position.
   * @param {number} params.end End position.
   * @param {string} params.text Selected text.
   * @param {string} params.backgroundColor Selected background color.
   * @param {string} params.color Selected color.
   */
  addSelection(params) {
    if (
      typeof params.start !== 'number' || params.start < 0 ||
      typeof params.end !== 'number' || params.end < params.start ||
      typeof params.text !== 'string' || //params.text.length !== params.end - params.start ||
      typeof params.backgroundColor !== 'string' || typeof params.color !== 'string'
    ) {
      return; // Invalid input
    }

    this.selections = this.selections
      .filter(selection => selection.start < params.start || selection.end > params.end) // remove consumed selections
      .map(selection => {
        // Shrink existing selection if overlapping with new selection
        if (selection.start >= params.start && selection.start < params.end && selection.end >= params.end) {
          selection.start = params.end;
        }
        if (selection.end > params.start && selection.end <= params.end) {
          selection.end = params.start;
        }

        selection.text = TextProcessing.getMaskedText(
          this.textCharacteristics.decodedText,
          this.textCharacteristics.decodedMask,
          selection.start,
          selection.end
        );

        return selection;
      });

    // Split existing selection if new selection wants in between
    for (let i = this.selections.length - 1; i >= 0; i--) {
      if (this.selections[i].start < params.start && this.selections[i].end > params.end) {
        const selectionClone = {...this.selections[i]};

        this.selections[i].text = TextProcessing.getMaskedText(
          this.textCharacteristics.decodedText,
          this.textCharacteristics.decodedMask,
          this.selections[i].start,
          params.start
        );
        this.selections[i].end = params.start;

        selectionClone.text = TextProcessing.getMaskedText(
          this.textCharacteristics.decodedText,
          this.textCharacteristics.decodedMask,
          params.end
        );
        selectionClone.start = params.end;

        this.selections.push(selectionClone);
      }
    }

    this.selections.push(params);

    this.selections = this.selections
      .sort((a, b) => a.start - b.start) // Sort ascending
      .reduce((newSelections, selection, index) => {
        if (this.selections.length === 1) {
          return [selection];
        }
        if (index === this.selections.length - 1) {
          return [...newSelections, selection];
        }

        // Merge all adjacent selections with same color
        if (
          selection.backgroundColor === this.selections[index + 1].backgroundColor &&
          selection.end >= this.selections[index + 1].start
        ) {
          this.selections[index + 1].start = selection.start;
          this.selections[index + 1].text = TextProcessing.getMaskedText(this.textCharacteristics.decodedText, this.textCharacteristics.decodedMask, this.selections[index + 1].start, this.selections[index + 1].end);
          selection.backgroundColor = '';
        }

        return [...newSelections, selection];
      }, [])
      .filter(selection => {
        // Remove deleted selections
        return selection.backgroundColor !== '';
      })
      .map(selection => {
        // Evaluate
        const found = this.params.solutions.filter(solution =>
          solution.name === this.colorToNameLookup[selection.backgroundColor] &&
          solution.start === selection.start &&
          solution.end === selection.end
        );

        selection.score = (found.length === 1) ? 1 : -1;
        return selection;
      });
  }

  /**
   * Remove selection.
   * @param {number} position Position that is in selection.
   */
  removeSelection(position) {
    this.selections = this.selections.filter(selection => selection.start > position && selection.end <= position);
  }

  /**
   * Remove all selections.
   */
  removeSelections() {
    this.selections = [];
  }

  /**
   * Clear selections on screen.
   */
  clearSelections() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
    else if (document.selection) {
      document.selection.empty();
    }

    this.pendingSelection = null;
  }

  /**
   * Get output suitable for different purposes, e.g. scores, solution, xAPI.
   * @param {string} mode Mode.
   * @return {string} Output text.
   */
  getOutput(mode) {
    const selections = (mode === 'solution' || mode === 'xapi-solution') ?
      this.params.solutions :
      this.selections;

    // Break up selections, assuming no overlaps and sorted
    let selectionSplits = [];
    let donePosition = 0;

    selections.forEach(selection => {
      if (selection.start > donePosition) {
        selectionSplits.push({
          start: donePosition,
          end: selection.start
        });
      }
      selectionSplits.push(selection);
      donePosition = selection.end;
    });
    if (donePosition < this.textCharacteristics.decodedText.length) {
      selectionSplits.push({
        start: donePosition,
        end: this.textCharacteristics.decodedText.length
      });
    }

    const results = selectionSplits.map(selection => {
      return this.getSelectionOutput(selection, mode);
    });

    const newText = results.reduce((text, segment) => `${text}${segment.text}`, '');
    const newMask = results.reduce((mask, segment) => `${mask}${segment.mask}`, '');

    return TextProcessing.htmlEncodeMasked(newText, newMask);
  }

  /**
   * Add handler for selecting text due to lack of selectionend listener.
   */
  addSelectEventHandler() {
    document.addEventListener('mouseup', this.handleSelectionEnd.bind(this));
    document.addEventListener('touchend', this.handleSelectionEnd.bind(this));

    this.selectionChangedListener = this.handleSelectionChange.bind(this);
    this.params.textArea.addEventListener('selectstart', (event) => {
      if (this.disabled) {
        return;
      }

      // Prevent accidentally selecting paragraph with multiple clicks
      if (this.lastSelectStart && event.timeStamp - this.lastSelectStart < 1000) {
        return;
      }
      this.lastSelectStart = event.timeStamp;

      document.addEventListener('selectionchange', this.selectionChangedListener);
    });
  }

  /**
   * Get local node text offset.
   * @param {Node} node Node to get local text offset.
   * @return {number} Local text offset.
   */
  getLocalOffset(node) {
    const siblings = [...node.parentElement.childNodes];
    return siblings
      .slice(0, siblings.indexOf(node)) // left siblings
      .reduce((length, sibling) => {
        return length + sibling.textContent.length;
      }, 0); // summed length of left siblings
  }

  /**
   * Get offset of selection in node.
   * @param {Node} node Node that contains selection text.
   * @return {number} Number of characters in nodes in front of node.
   */
  getSelectionOffset(node) {
    let offset = 0;
    while (node !== this.params.textArea) {
      const add = this.getLocalOffset(node);

      offset += add;

      node = node.parentElement;
    }

    return offset;
  }

  /**
   * Get ouptut text and mask for a selection.
   * @param {object[]} selection Selections by user.
   * @param {string} [mode=null] Mode, scores|solution.
   */
  getSelectionOutput(selection, mode) { ///
    if (!selection.backgroundColor) {
      return { // Not selected, use original text
        text: this.textCharacteristics.decodedText.substring(selection.start, selection.end),
        mask: this.textCharacteristics.decodedMask.substring(selection.start, selection.end)
      };
    }

    let spanPre = '';
    let spanPost = '';

    // Output per mode required
    if (mode === 'xapi-result') {
      let scoreClass = '';
      if (selection.score === 1) {
        scoreClass = 'h5p-highlight-the-words-user-response-correct';
      }
      else if (selection.score === -1) {
        scoreClass = 'h5p-highlight-the-words-user-response-wrong';
      }

      spanPre = `<span class="${scoreClass}"><span class="h5p-highlight-the-words-selection h5p-highlight-the-words-selection-background-color-${selection.backgroundColor.substr(1)} h5p-highlight-the-words-selection-color-${selection.color.substr(1)}">`;
      spanPost = '</span></span>';
    }
    else if (mode === 'xapi-solution') {
      spanPre = `<span class="h5p-highlight-the-words-selection h5p-highlight-the-words-selection-background-color-${selection.backgroundColor.substr(1)} h5p-highlight-the-words-selection-color-${selection.color.substr(1)}">`;
      spanPost = '</span>';
    }
    else {
      spanPre = `<span class="h5p-highlight-the-words-selection" style="background-color: ${selection.backgroundColor}; color: ${selection.color};">`;

      const classNames = ['h5p-highlight-the-words-score-point'];
      if (mode === 'scores') {
        const className = (selection.score === 1) ?
          'h5p-highlight-the-words-correct' :
          'h5p-highlight-the-words-wrong';
        classNames.push(className);
      }
      // Separate span for score point to get correct position for multi-line selections
      spanPost = `</span><span class="${classNames.join(' ')}"></span>`;
    }

    let text = this.textCharacteristics.decodedText.substring(selection.start, selection.end);
    let mask = this.textCharacteristics.decodedMask.substring(selection.start, selection.end);

    // TODO: Clean up. Adding divs necessary when selecting text over paragraphs
    // while keeping mask in sync
    const regexp = new RegExp('</div><div>', 'gm');
    let indices = [];
    let array;

    while ((array = regexp.exec(text)) !== null) {
      indices.push(array.index);
    }

    const textArray = [];
    const maskArray = [];

    let position = 0;
    indices.forEach(index => {
      textArray.push(text.substring(position, index));
      maskArray.push(mask.substring(position, index));
      position = index + '</div><div>'.length;
    });
    textArray.push(text.substring(position));
    maskArray.push(mask.substring(position));

    text = textArray.join(`${spanPost}</div><div>${spanPre}`);

    let htmlPlaceholder = Array(`${spanPost}</div><div>${spanPre}`.length + 1).join('0');
    mask = maskArray.join(htmlPlaceholder);

    text = `${spanPre}${text}${spanPost}`;
    htmlPlaceholder = Array(spanPre.length + 1).join('0');
    mask = `${htmlPlaceholder}${mask}`;
    htmlPlaceholder = Array(spanPost.length + 1).join('0');
    mask = `${mask}${htmlPlaceholder}`;

    return {
      text: text,
      mask: mask
    };
  }

  /**
   * Update text container.
   * Rebuilds the innerHTML from the original text, because modifying the
   * HTML strings would be hell
   *
   * @param {string} [mode=null] Mode, scores|solution.
   */
  updateTextContainer(mode = null) {
    this.callbacks.onTextUpdated(this.getOutput(mode), mode);
  }

  /**
   * Recompute positions for solution after decoding.
   * @param {object} solutions Solutions.
   * @param {string} Encoded text.
   * @return {object} Solutions with new start/end positions.
   */
  static recomputeSolutionPositions(solutions, textEncoded) {
    const regexpEntities = /&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/ig;

    let solutionsCopy = solutions.slice();

    let occurrences;
    while ((occurrences = regexpEntities.exec(textEncoded)) !== null) {
      solutionsCopy = solutionsCopy.map(solution => {
        if (solution.start > occurrences.index) {

          solution.start = solution.start - occurrences[0].length + 1;
          solution.end = solution.end - occurrences[0].length + 1;
        }
        return solution;
      });
    }

    return solutionsCopy;
  }

  /**
   * Handle selection change event.
   */
  handleSelectionChange() {
    if (this.disabled) {
      return;
    }

    // Will always be from textContainer
    this.pendingSelection = document.getSelection();
  }

  /**
   * Handle selection end event.
   */
  handleSelectionEnd() {
    if (this.disabled) {
      return;
    }

    document.removeEventListener('selectionchange', this.selectionChangedListener);

    if (
      !this.pendingSelection || // Can have been cleared
      !Util.isChild(this.pendingSelection.anchorNode, this.params.textArea) // Start was not in textArea
    ) {
      this.pendingSelection = null;
      return; // Part of selection outside of text container
    }

    let start = null;
    let end = null;

    // Selection ended outside of textArea
    if (!Util.isChild(this.pendingSelection.focusNode, this.params.textArea)) {
      let focusNode = this.pendingSelection.focusNode;
      while (focusNode.nodeType !== 1) {
        focusNode = focusNode.parentElement;
      }

      const allElements = [...document.getElementsByTagName('*')];
      const textAreaIndex = allElements.indexOf(this.params.textArea);
      const focusIndex = allElements.indexOf(focusNode);

      end = (focusIndex < textAreaIndex) ? this.selectMin + 1 : this.selectMax;
    }

    start = this.pendingSelection.anchorOffset;
    start += this.getSelectionOffset(this.pendingSelection.anchorNode);
    start = Util.nthIndexOf(this.textCharacteristics.encodedMask, '1', start + 1);

    if (end === null) {
      end = this.pendingSelection.focusOffset;
      end += this.getSelectionOffset(this.pendingSelection.focusNode);
      // If selecting backwards to very first char, end needs to be 0
      end = Util.nthIndexOf(this.textCharacteristics.encodedMask, '1', end) + ((end === 0) ? 0 : 1);
    }

    if (this.pendingSelection.isCollapsed) {
      // TODO: Can be used to do more with this selection
      // const existingSelection = this.findSelection(start);
      return; // Select on double click
    }

    // When selecting complete text backwards, something is odd
    if (start === -1) {
      start = this.selectMin;
      end = this.selectMax;
    }

    // Reverse order of selection
    if (start > end) {
      const tmp = start;
      start = end;
      end = tmp;

      // Will make sure to ignore leading/trailing HTML on backwards selection
      let text, lead;
      [text, lead] = TextProcessing.trimMaskedText(
        this.textCharacteristics.decodedText,
        this.textCharacteristics.decodedMask,
        start,
        end
      );

      start = start + lead;
      end = start + text.length;
    }

    const text = TextProcessing.getMaskedText(
      this.textCharacteristics.decodedText,
      this.textCharacteristics.decodedMask,
      start,
      end
    );

    // New selection
    this.addSelection({
      name: this.colorToNameLookup[this.currentSelectColors.backgroundColor],
      text: text,
      start: start,
      end: end,
      backgroundColor: this.currentSelectColors.backgroundColor,
      color: this.currentSelectColors.color
    });

    this.updateTextContainer();

    this.clearSelections();
    this.pendingSelection = null;
  }
}
export default SelectionHandler;
