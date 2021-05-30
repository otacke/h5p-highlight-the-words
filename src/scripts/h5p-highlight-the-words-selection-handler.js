import Util from './h5p-highlight-the-words-util';
import Selection from './h5p-highlight-the-words-selection';
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

    this.callbacks = Util.extend({
      onTextUpdated: () => {},
      onInteracted: () => {},
      onSelectionChanged: () => {}
    }, callbacks);

    this.solutions = this.params.solutions.map(solution => {
      return new Selection(solution);
    });

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
    this.lastSelectStarts = [];

    // State for being disabled
    this.disabled = false;

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
      .filter(selection => selection.getStart() <= position && selection.getEnd() > position)
      .shift();
  }

  /**
   * Set custom selection attribute.
   * @param {number} position Position of selection.
   * @param {string} id Id of attribute.
   * @param {object} params Parameters.
   * @param {string} params.mergeMode Mode for merging selections.
   */
  setSelectionAttribute(position, id, params) {
    const targetSelection = this.findSelection(position);
    if (!targetSelection) {
      return;
    }

    targetSelection.setAttribute(id, params);
  }

  /**
   * Activate selection.
   * @param {number} position Position to check for selection.
   */
  activateSelection(position) {
    const targetSelection = this.findSelection(position);
    if (!targetSelection) {
      return;
    }

    this.selections.forEach(selection => {
      if (selection === targetSelection) {
        selection.activate();
      }
      else {
        selection.deactivate();
      }
    });

    this.updateTextContainer();
  }

  /**
   * Deactivate all selections.
   */
  deactivateAllSelections() {
    this.selections.forEach(selection => {
      selection.deactivate();
    });

    this.updateTextContainer();
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
      .filter(selection => selection.getStart() < params.start || selection.getEnd() > params.end) // remove consumed selections
      .map(selection => {
        // Shrink existing selection if overlapping with new selection and reset attributes
        if (selection.getStart() >= params.start && selection.getStart() < params.end && selection.getEnd() >= params.end) {
          selection.setStart(params.end);
          selection.setAttributes({});
        }
        if (selection.getEnd() > params.start && selection.getEnd() <= params.end) {
          selection.setEnd(params.start);
          selection.setAttributes({});
        }

        selection.setText(
          TextProcessing.getMaskedText(
            this.textCharacteristics.decodedText,
            this.textCharacteristics.decodedMask,
            selection.getStart(),
            selection.getEnd()
          )
        );

        return selection;
      });

    // Split existing selection if new selection wants in between
    for (let i = this.selections.length - 1; i >= 0; i--) {
      if (this.selections[i].getStart() < params.start && this.selections[i].getEnd() > params.end) {
        const selectionClone = this.selections[i].getClone();

        this.selections[i].setText(
          TextProcessing.getMaskedText(
            this.textCharacteristics.decodedText,
            this.textCharacteristics.decodedMask,
            this.selections[i].getStart(),
            params.start
          )
        );

        this.selections[i].setEnd(params.start);

        selectionClone.setText(
          TextProcessing.getMaskedText(
            this.textCharacteristics.decodedText,
            this.textCharacteristics.decodedMask,
            params.end
          )
        );
        selectionClone.setStart(params.end);

        this.selections.push(selectionClone);
      }
    }

    this.selections.push(new Selection(params));

    this.selections = this.selections
      .sort((a, b) => a.getStart() - b.getStart()) // Sort ascending
      .reduce((newSelections, selection, index) => {
        if (this.selections.length === 1) {
          return [selection];
        }
        if (index === this.selections.length - 1) {
          return [...newSelections, selection];
        }

        // Merge all adjacent selections with same color
        if (
          selection.getBackgroundColor() === this.selections[index + 1].getBackgroundColor() &&
          selection.getEnd() >= this.selections[index + 1].getStart()
        ) {
          // Copy attributes of first selection to adjacent ones
          if (selection.containsAttribute('capitalization')) {
            this.selections[index + 1].setAttribute(
              'capitalization',
              selection.getAttribute('capitalization')
            );
          }

          this.selections[index + 1].setStart(selection.getStart());
          this.selections[index + 1].setText(
            TextProcessing.getMaskedText(
              this.textCharacteristics.decodedText,
              this.textCharacteristics.decodedMask,
              this.selections[index + 1].getStart(),
              this.selections[index + 1].getEnd()
            )
          );

          selection.setBackgroundColor('');
        }

        return [...newSelections, selection];
      }, [])
      .filter(selection => {
        // Remove deleted selections
        return selection.getBackgroundColor() !== '';
      })
      .map(selection => {
        // Evaluate
        const found = this.params.solutions.filter(solution =>
          solution.name === this.colorToNameLookup[selection.getBackgroundColor()] &&
          solution.start === selection.getStart() &&
          solution.end === selection.getEnd()
        );

        selection.setScore((found.length === 1) ? 1 : -1);
        return selection;
      });
  }

  /**
   * Remove selection.
   * @param {number} position Position that is in selection.
   */
  removeSelection(position) {
    this.selections = this.selections
      .filter(selection => selection.getStart() > position && selection.getEnd() <= position);
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
      this.solutions :
      this.selections;

    // Break up selections, assuming no overlaps and sorted
    let selectionSplits = [];
    let donePosition = 0;

    selections.forEach(selection => {
      if (selection.getStart() > donePosition) {
        selectionSplits.push(new Selection({
          start: donePosition,
          end: selection.getStart()
        }));
      }
      selectionSplits.push(selection);
      donePosition = selection.getEnd();
    });
    if (donePosition < this.textCharacteristics.decodedText.length) {
      selectionSplits.push(new Selection ({
        start: donePosition,
        end: this.textCharacteristics.decodedText.length
      }));
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
    document.addEventListener('mouseup', (event) => {
      this.handleSelectionEnd(event);
    });
    document.addEventListener('touchend', (event) => {
      this.handleSelectionEnd(event);
    });

    // this.selectionChangedListener = this.handleSelectionChange.bind(this);
    // this.params.textArea.addEventListener('selectstart', (event) => {
    //   if (this.disabled) {
    //     return;
    //   }
    //
    //   // Prevent accidentally selecting paragraph with multiple clicks
    //   console.log(this.lastSelectStarts.length);
    //   if (this.lastSelectStarts.length > 0) {
    //     console.log('BLOCK');
    //     return;
    //   }
    //   this.lastSelectStarts.push(event.timeStamp);
    //   console.log(this.lastSelectStarts);
    //   this.lastSelectStarts = this.lastSelectStarts.filter(timeStamp => timeStamp > event.timeStamp - 500);
    //
    //   document.addEventListener('selectionchange', this.selectionChangedListener);
    // });
  }

  /**
   * Get local node text offset.
   * @param {Node} node Node to get local text offset.
   * @return {number} Local text offset.
   */
  getLocalOffset(node) {
    const siblings = Array.prototype.slice.call(node.parentNode.childNodes); // Damn you, IE11!
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

      node = node.parentNode;
    }

    return offset;
  }

  /**
   * Get ouptut text and mask for a selection.
   * @param {object[]} selection Selections by user.
   * @param {string} [mode=null] Mode, scores|solution.
   */
  getSelectionOutput(selection, mode) {
    if (!selection.getBackgroundColor()) {
      return { // Not selected, use original text
        text: this.textCharacteristics.decodedText.substring(selection.getStart(), selection.getEnd()),
        mask: this.textCharacteristics.decodedMask.substring(selection.getStart(), selection.getEnd())
      };
    }

    let spanPre = '';
    let spanPost = '';

    // Output per mode required
    if (mode === 'xapi-result') {
      let scoreClass = '';
      if (selection.getScore() === 1) {
        scoreClass = 'h5p-highlight-the-words-user-response-correct';
      }
      else if (selection.getScore() === -1) {
        scoreClass = 'h5p-highlight-the-words-user-response-wrong';
      }

      spanPre = `<span class="${scoreClass}"><span class="h5p-highlight-the-words-selection h5p-highlight-the-words-selection-background-color-${selection.getBackgroundColor().substr(1)} h5p-highlight-the-words-selection-color-${selection.getColor().substr(1)}">`;
      spanPost = '</span></span>';
    }
    else if (mode === 'xapi-solution') {
      spanPre = `<span class="h5p-highlight-the-words-selection h5p-highlight-the-words-selection-background-color-${selection.getBackgroundColor().substr(1)} h5p-highlight-the-words-selection-color-${selection.getColor().substr(1)}">`;
      spanPost = '</span>';
    }
    else {
      const classes = ['h5p-highlight-the-words-selection'];
      if (selection.isActive()) {
        classes.push('h5p-highlight-the-words-selection-active');
      }

      spanPre = `<span class="${classes.join(' ')}" style="background-color: ${selection.getBackgroundColor()}; color: ${selection.getColor()};">`;

      const classNames = ['h5p-highlight-the-words-score-point'];
      if (mode === 'scores') {
        const className = (selection.getScore() === 1) ?
          'h5p-highlight-the-words-correct' :
          'h5p-highlight-the-words-wrong';
        classNames.push(className);
      }
      // Separate span for score point to get correct position for multi-line selections
      spanPost = `</span><span class="${classNames.join(' ')}"></span>`;
    }

    let text = this.textCharacteristics.decodedText.substring(selection.getStart(), selection.getEnd());
    let mask = this.textCharacteristics.decodedMask.substring(selection.getStart(), selection.getEnd());

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
        if (solution.getStart() > occurrences.index) {

          solution.setStart(solution.getStart() - occurrences[0].length + 1);
          solution.setEnd(solution.getEnd() - occurrences[0].length + 1);
        }
        return solution;
      });
    }

    return solutionsCopy;
  }

  /**
   * Handle selection change event.
   */
  // handleSelectionChange() {
  //   if (this.disabled) {
  //     return;
  //   }
  //
  //   // Will always be from textContainer
  //   this.pendingSelection = document.getSelection();
  // }

  /**
   * Handle selection end event.
   */
  handleSelectionEnd() {
    if (this.disabled) {
      return; // Disabled
    }

    this.lastSelectStarts.push(event.timeStamp);
    this.lastSelectStarts = this.lastSelectStarts
      .filter(start => start > event.timeStamp - 1000);

    if (this.lastSelectStarts.length > 2) {
      return; // Prevent selecting whole paragraph by triple clicking
    }

    if (event.target !== this.params.exerciseArea && !Util.isChild(event.target, this.params.exerciseArea)) {
      return; // Outside of exercise area
    }

    // Workaround for iOS that doesn not support the selectstart event for some reason
    if (!this.pendingSelection) {
      this.pendingSelection = document.getSelection();
      if (!this.pendingSelection.anchorNode || !this.pendingSelection.focusNode) {
        this.pendingSelection = null;
      }
    }

    document.removeEventListener('selectionchange', this.selectionChangedListener);

    if (
      !this.pendingSelection || // Can have been cleared
      !Util.isChild(this.pendingSelection.anchorNode, this.params.textArea) // Start was not in textArea
    ) {
      this.pendingSelection = null;
      this.callbacks.onSelectionChanged();
      return; // Part of selection outside of text container
    }

    let start = null;
    let end = null;

    // Selection ended outside of textArea
    if (!Util.isChild(this.pendingSelection.focusNode, this.params.textArea)) {
      let focusNode = this.pendingSelection.focusNode;
      while (focusNode.nodeType !== 1) {
        focusNode = focusNode.parentNode;
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

    // Interpret as click on selection
    if (this.pendingSelection.isCollapsed) {
      if (start !== end || start <= this.selectMin) {
        return; // Not a click on an existing selection
      }

      const existingSelection = this.findSelection(start);
      this.callbacks.onSelectionChanged(existingSelection);
      return;
    }

    let text = TextProcessing.getMaskedText(
      this.textCharacteristics.decodedText,
      this.textCharacteristics.decodedMask,
      start,
      end
    );

    // Remove spaces around text, but allow selecting spaces only
    if (text.trim() !== text && text.trim() !== '') {
      [text, start, end] = TextProcessing.trimSpaces(text, start, end);
    }

    // New selection
    this.addSelection({
      name: this.colorToNameLookup[this.currentSelectColors.backgroundColor],
      text: text,
      start: start,
      end: end,
      backgroundColor: this.currentSelectColors.backgroundColor,
      color: this.currentSelectColors.color
    });

    // Handle interacted
    this.callbacks.onInteracted();
    this.callbacks.onSelectionChanged(this.findSelection(start));

    this.updateTextContainer();

    this.clearSelections();
    this.pendingSelection = null;

  }
}
export default SelectionHandler;
