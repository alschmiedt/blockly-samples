/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Flyout that supports always-open continuous scrolling.
 */

import * as Blockly from 'blockly/core';

/**
 * Class for continuous flyout.
 */
export class ContinuousFlyout extends Blockly.VerticalFlyout {
  /** @override */
  constructor(workspaceOptions) {
    super(workspaceOptions);

    /**
     * List of scroll positions for each category.
     * @type {!Array<{name: string, position: Object}>}
     */
    this.scrollPositions = [];

    /**
     * Target scroll position, used to smoothly scroll to a given category
     * location when selected.
     * @type {?number}
     */
    this.scrollTarget = null;

    /**
     * The percentage of the distance to the scrollTarget that should be
     * scrolled at a time. Lower values will produce a smoother, slower scroll.
     * @type {number}
     */
    this.scrollAnimationFraction = 0.3;

    /**
     * A recycle bin for blocks.
     * @type {!Array.<!Blockly.Block>}
     * @private
     */
    this.recycleBlocks_ = [];

    this.recyclingEnabled_ = true;

    this.autoClose = false;
  }

  /**
   * Records scroll position for each category in the toolbox.
   * The scroll position is determined by the coordinates of each category's
   * label after the entire flyout has been rendered.
   */
  recordScrollPositions() {
    for (const button of this.buttons_) {
      if (button.isLabel()) {
        this.scrollPositions.push({
          name: button.getButtonText(),
          position: button.getPosition(),
        });
      }
    }
  }

  /**
   * Returns the scroll position for the given category name.
   * @param {string} name Category name.
   * @return {?Object} Scroll position for given category, or null if not found.
   */
  getCategoryScrollPosition(name) {
    for (const scrollInfo of this.scrollPositions) {
      if (scrollInfo.name === name) {
        return scrollInfo.position;
      }
    }
    console.warn(`Scroll position not recorded for category ${name}`);
    return null;
  }

  /**
   * Step the scrolling animation by scrolling a fraction of the way to
   * a scroll target, and request the next frame if necessary.
   * @package
   */
  stepScrollAnimation() {
    if (!this.scrollTarget) {
      return;
    }

    const currentScrollPos = -this.workspace_.scrollY;
    const diff = this.scrollTarget - currentScrollPos;
    if (Math.abs(diff) < 1) {
      this.scrollbar.set(this.scrollTarget);
      this.scrollTarget = null;
      return;
    }
    this.scrollbar.set(currentScrollPos + diff * this.scrollAnimationFraction);

    requestAnimationFrame(this.stepScrollAnimation.bind(this));
  }

  /**
   * @override
   */
  show(flyoutDef) {
    super.show(flyoutDef);
    this.emptyRecycleBlocks_();
  }

  /**
   * @override
   */
  createBlock_(blockXml) {
    const id = blockXml.getAttribute('id') || blockXml.getAttribute('type');
    const recycled = this.recycleBlocks_.findIndex(function(block) {
      return block.id === id || block.type === id;
    });

    // If we found a recycled item, reuse the BlockSVG from last time.
    // Otherwise, convert the XML block to a BlockSVG.
    let curBlock;
    if (recycled > -1) {
      curBlock = this.recycleBlocks_.splice(recycled, 1)[0];
    } else {
      curBlock = Blockly.Xml.domToBlock(blockXml, this.workspace_);
    }

    if (curBlock.disabled) {
      // Record blocks that were initially disabled.
      // Do not enable these blocks as a result of capacity filtering.
      this.permanentlyDisabled_.push(curBlock);
    }
    return curBlock;
  }

  blockIsRecyclable(block) {
    // If the block needs to parse mutations, never recycle.
    if (block.mutationToDom && block.domToMutation) {
      return false;
    }

    for (let i = 0; i < block.inputList.length; i++) {
      const input = block.inputList[i];
      for (let j = 0; j < input.fieldRow.length; j++) {
        const field = input.fieldRow[j];
        // No variables.
        if (field instanceof Blockly.FieldVariable) {
          return false;
        }
        if (field instanceof Blockly.FieldDropdown) {
          if (field.isOptionListDynamic()) {
            return false;
          }
        }
      }
      // Check children.
      if (input.connection) {
        const child = input.connection.targetBlock();
        if (child && !this.blockIsRecyclable(child)) {
          return false;
        }
      }
    }
    return true;
  }

  clearOldBlocks_() {
    // Delete any blocks from a previous showing.
    const oldBlocks = this.workspace_.getTopBlocks(false);
    for (let i = 0, block; (block = oldBlocks[i]); i++) {
      if (block.workspace == this.workspace_) {
        if (this.recyclingEnabled_ &&
          this.blockIsRecyclable(block)) {
          this.recycleBlock_(block);
        } else {
          block.dispose(false, false);
        }
      }
    }
    // Delete any mats from a previous showing.
    for (let j = 0; j < this.mats_.length; j++) {
      const rect = this.mats_[j];
      if (rect) {
        Blockly.Tooltip.unbindMouseEvents(rect);
        Blockly.utils.dom.removeNode(rect);
      }
    }
    this.mats_.length = 0;
    // Delete any buttons from a previous showing.
    for (let i = 0, button; (button = this.buttons_[i]); i++) {
      button.dispose();
    }
    this.buttons_.length = 0;

    // Clear potential variables from the previous showing.
    this.workspace_.getPotentialVariableMap().clear();
  }

  /**
   * Empty out the recycled blocks, properly destroying everything.
   * @private
   */
  emptyRecycleBlocks_() {
    // Clean out the old recycle bin.
    const oldBlocks = this.recycleBlocks_;
    this.recycleBlocks_ = [];
    for (let i = 0; i < oldBlocks.length; i++) {
      oldBlocks[i].dispose(false, false);
    }
  }

  recycleBlock_(block) {
    const xy = block.getRelativeToSurfaceXY();
    block.moveBy(-xy.x, -xy.y);
    this.recycleBlocks_.push(block);
  }
}
