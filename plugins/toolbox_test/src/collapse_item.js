/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Creates a toolbox item that when clicked will switch out the
 * default category to make it smaller or more verbose.
 */

import * as Blockly from 'blockly';

import {HeavyTextCategory} from '../src/index';

/**
 * Creates a toolbox item that when clicked collapses and expands the toolbox.
 */
export class CollapseIcon extends Blockly.ToolboxItem {
  /** @override */
  constructor(toolboxItemDef, toolbox, opt_parent) {
    super(toolboxItemDef, toolbox, opt_parent);

    /**
     * The icon div.
     * @type {?Element}
     */
    this.iconDiv = null;
  }

  /** @override */
  init() {
    this.createDom_();
  }
  /**
   * Creates the dom for the collapsable icon.
   */
  createDom_() {
    this.iconDiv = document.createElement('div');
    if (this.parentToolbox_.isClosed) {
      this.iconDiv.innerHTML = '&#xe5e0;';
    } else {
      this.iconDiv.innerHTML = '&#xe5e1;';
    }

    this.iconDiv.classList.add('material-icons');
    this.iconDiv.style.fontSize = '1em';
  }

  /** @override */
  getDiv() {
    return this.iconDiv;
  }

  /** @override */
  isSelectable() {
    return true;
  }

  /**
   * Changes the background color when it is selected.
   * @param {boolean} isSelected True if this category is selected, false
   *     otherwise.
   * @public
   */
  setSelected(isSelected) {
    if (isSelected) {
      this.iconDiv.style.backgroundColor = 'gray';
    } else {
      this.iconDiv.style.backgroundColor = '';
    }
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
    return this.iconDiv;
  }

  /**
   * Gets the contents of the toolbox item. These are items that are meant to be
   * displayed in the flyout.
   * @return {!Blockly.utils.toolbox.FlyoutItemInfoArray|string} The definition
   *     of items to be displayed in the flyout.
   * @public
   */
  getContents() {
    return [];
  }

  /**
   * Gets the name of the toolbox item. Used for emitting events.
   * @return {string} The name of the toolbox item.
   * @public
   */
  getName() {
    return 'open';
  }

  /**
   * Handles when the toolbox item is clicked.
   * @param {!Event} _e Click event to handle.
   * @public
   */
  onClick() {
    if (this.parentToolbox_.isClosed) {
      this.parentToolbox_.isClosed = false;
      this.openToolbox_();
    } else {
      this.parentToolbox_.isClosed = true;
      this.collapseToolbox_();
    }
  }

  /**
   * Registers the default category class and update the toolbox so it will
   * re render.
   * @protected
   */
  collapseToolbox_() {
    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.ToolboxCategory.registrationName, Blockly.ToolboxCategory,
        true);

    const workspace = Blockly.getMainWorkspace();
    workspace.updateToolbox(workspace.options.languageTree);
  }

  /**
   * Registers the HeavyTextCategory and update the toolbox so it will re
   * render.
   * @protected
   */
  openToolbox_() {
    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.ToolboxCategory.registrationName, HeavyTextCategory, true);

    const workspace = Blockly.getMainWorkspace();
    workspace.updateToolbox(workspace.options.languageTree);
  }

  /** @override */
  dispose() {
    Blockly.utils.dom.removeNode(this.iconDiv);
  }
}

Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM, 'collapseIcon', CollapseIcon, true);
