/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Creates a search item to add to the toolbox. This can
 * be used by specifying 'kind': 'searchItem' in your toolbox definition.
 */

import * as Blockly from 'blockly';

/**
 * A toolbox item that holds an input used for searching blocks.
 */
export class SearchItem extends Blockly.ToolboxItem {
  /** @override */
  constructor(toolboxItemDef, toolbox, opt_parent) {
    super(toolboxItemDef, toolbox, opt_parent);

    /**
     * The toolbox item container.
     * @type {?Element}
     * @protected
     */
    this.container_ = null;

    /**
     * The search input.
     * @type {?HTMLInputElement}
     * @protected
     */
    this.input_ = null;
  }

  /** @override */
  init() {
    this.createDom_();
  }

  /**
   * Creates the dom for the toolbox item.
   */
  createDom_() {
    this.container_ = document.createElement('div');
    this.container_.textContent = 'Search:';
    this.input_ = document.createElement('input');
    this.container_.appendChild(this.input_);
    this.container_.classList.add('customClass');
    Blockly.bindEventWithChecks_(
        this.input_, 'input', this, () => this.onInput_());
  }

  /** @override */
  getDiv() {
    return this.container_;
  }

  /**
   * Handles when the toolbox item is clicked.
   * @param {!Event} _e Click event to handle.
   * @public
   */
  onClick() {}

  /**
   * Forces the toolbox to refresh the flyout every time a user types in the
   * search bar. This forces the toolbox to call getContents on this item.
   */
  onInput_() {
    this.parentToolbox_.refreshSelection();
  }

  getAllBlocks() {
    const searchText = this.input_.value;
    let contents = [];
    for (const toolboxItem of this.parentToolbox_.getToolboxItems()) {
      if (toolboxItem instanceof Blockly.ToolboxCategory) {
        /**
         * @type {string|Blockly.utils.toolbox.FlyoutItemInfoArray|
         *    Blockly.utils.toolbox.FlyoutItemInfo}
         */
        let itemContents = toolboxItem.getContents();

        // Handle custom categories (e.g. variables and functions)
        if (typeof itemContents === 'string') {
          itemContents =
              /** @type {!Blockly.utils.toolbox.DynamicCategoryInfo} */ ({
                custom: itemContents,
                kind: 'CATEGORY',
              });
        }
        for (const item of itemContents) {
          console.log(item);
          if (item['kind'] == 'block' &&
              item['type'].indexOf(searchText) > -1) {
            contents = contents.concat(item);
          }
        }
      }
    }
    return contents;
  }

  /**
   * Gets the html element that is clickable.
   * The parent toolbox element receives clicks. The parent toolbox will add an
   * id to this element so it can pass the onClick event to the correct
   * toolboxItem.
   * @return {!Element} The html element that receives clicks.
   * @public
   */
  getClickTarget() {
    return this.container_;
  }

  setSelected(isSelected) {
    if (isSelected) {
      this.input_.focus();
    } else {
      this.input_.blur();
      // TODO: The contents div would have to be public.
      this.parentToolbox_.contentsDiv_.focus();
    }
  }
  /**
   * Gets all the blocks to be displayed in the flyout.
   * @return {Blockly.utils.toolbox.FlyoutItemInfoArray} The contents to be
   *     displayed in the flyout.
   */
  getContents() {
    return this.getAllBlocks();
  }

  /**
   * Gets the name of the toolbox item. Used for emitting events.
   * @return {string} The name of the toolbox item.
   * @public
   */
  getName() {
    return 'SearchItem';
  }

  /**
   * Whether the toolbox item is selectable.
   * @return {boolean} True if the toolbox item can be selected.
   * @public
   */
  isSelectable() {
    return true;
  }

  /** @override */
  dispose() {
    Blockly.utils.dom.removeNode(this.container_);
  }
}

Blockly.Css.register([`
     .customClass {
       padding: .5em;
     } 
 `]);

Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM, 'searchItem', SearchItem);
