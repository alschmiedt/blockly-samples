/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Adds onBlocklyAction methods to fields, the toolbox, the flyout
 * and the cursor.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import * as Blockly from 'blockly/core';
import * as Constants from '../src/constants';

/**
 * Class responsible for adding onBlocklyAction handlers to fields, the toolbox,
 * the flyout and the cursor.
 * TODO: Test adding a class with onBlocklyAction already added.
 * TODO: GO through this and update names.
 */
export class AddShortcutHandlers {
  /**
   * Adds onBlocklyAction methods that do not rely on a workspace.
   */
  constructor() {
    this.addShortcutHandlers();
  }

  /**
   * Adds onBlocklyAction methods to core Blockly classes that require it.
   * Ex: Flyout, Toolbox, Cursor, and certain fields.
   */
  addShortcutHandlers() {
    this.addFieldColourShortcutHandlers();
    this.addFieldDropdownShortcutHandlers();
    this.addToolboxShortcutHandler();
  }

  /**
   * Adds onBlocklyAction method to the colour field.
   * No-op if the colour field is not registered.
   */
  addFieldColourShortcutHandlers() {
    if (!Blockly.FieldColour) {
      return;
    }
    /**
     * Handles the given action.
     * This is only triggered when keyboard accessibility mode is enabled.
     * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut
     *     to be handled.
     * @return {boolean} True if the field handled the action, false otherwise.
     * TODO: Need to check if Blockly.FieldColour and the rest of the fields
     * exist, before doing this.
     * @package
     */
    Blockly.FieldColour.prototype.onBlocklyAction = function(shortcut) {
      if (this.picker_) {
        switch (shortcut.name) {
          case Constants.ShortcutNames.PREVIOUS:
            this.moveHighlightBy_(0, -1);
            return true;
          case Constants.ShortcutNames.NEXT:
            this.moveHighlightBy_(0, 1);
            return true;
          case Constants.ShortcutNames.OUT:
            this.moveHighlightBy_(-1, 0);
            return true;
          case Constants.ShortcutNames.IN:
            this.moveHighlightBy_(1, 0);
            return true;
          default:
            return false;
        }
      }
      return Blockly.FieldColour.superClass_.onBlocklyAction.call(this, shortcut);
    };
  }

  /**
   * Adds onBlocklyAction method to the dropdown field.
   * No-op if the colour field is not registered.
   */
  addFieldDropdownShortcutHandlers() {
    if (!Blockly.FieldDropdown) {
      return;
    }
    /**
     * Handles the given action.
     * This is only triggered when keyboard accessibility mode is enabled.
     * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut
     *     to be handled.
     * @return {boolean} True if the field handled the action, false otherwise.
     * @package
     */
    Blockly.FieldDropdown.prototype.onBlocklyAction = function(shortcut) {
      if (this.menu_) {
        switch (shortcut.name) {
          case Constants.ShortcutNames.PREVIOUS:
            this.menu_.highlightPrevious();
            return true;
          case Constants.ShortcutNames.NEXT:
            this.menu_.highlightNext();
            return true;
          default:
            return false;
        }
      }
      return Blockly.FieldDropdown.superClass_.onBlocklyAction.call(this, shortcut);
    };
  }

  /**
   * Adds onBlocklyAction method to the toolbox.
   * No-op if the default toolbox does not exist or if the toolbox already has
   * and onBlocklyAction method.
   */
  addToolboxShortcutHandler() {
    if (!Blockly.Toolbox || Blockly.Toolbox.prototype.onBlocklyAction) {
      return;
    }
    /**
     * Handles the given Blockly action on a toolbox.
     * This is only triggered when keyboard accessibility mode is enabled.
     * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut
     *     to be handled.
     * @return {boolean} True if the field handled the action, false otherwise.
     * @package
     */
    Blockly.Toolbox.prototype.onBlocklyAction = function(shortcut) {
      if (!this.selectedItem_) {
        return false;
      }
      switch (shortcut.name) {
        case Constants.ShortcutNames.PREVIOUS:
          return this.selectPrevious_();
        case Constants.ShortcutNames.OUT:
          return this.selectParent_();
        case Constants.ShortcutNames.NEXT:
          return this.selectNext_();
        case Constants.ShortcutNames.IN:
          return this.selectChild_();
        default:
          return false;
      }
    };
  }
}
