/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Adds a method to certain components (fields and the toolbox)
 * that allows them to handle keyboard shortcuts.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import * as Blockly from 'blockly/core';
import * as Constants from '../src/constants';

/**
 * Class responsible for adding methods to fields and the toolbox that allows
 * them to handle keyboard shortcuts.
 * TODO: Go through and update onBlocklyAction -> onShortcut.
 * TODO: Should these components have a setOnBlocklyAction?
 * TOOD: Should these be @package?
 */
export class AddOnShortcut {
  /**
   * Adds methods to handle keyboard shortcuts.
   */
  constructor() {
    this.addShortcutHandlers();
  }

  /**
   * Adds methods to core Blockly components that allows them to handle keyboard
   * shortcuts.
   */
  addShortcutHandlers() {
    this.addFieldColourShortcutHandler_();
    this.addFieldDropdownShortcutHandler_();
    this.addToolboxShortcutHandler_();
  }

  /**
   * Adds method to handle keyboard shortcuts to the colour field.
   * No-op if the colour field is not available.
   * @protected
   */
  addFieldColourShortcutHandler_() {
    if (!Blockly.FieldColour) {
      return;
    }
    /**
     * Handles the given keyboard shortcut.
     * This is only triggered when keyboard accessibility mode is enabled.
     * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut
     *     to be handled.
     * @return {boolean} True if the field handled the shortcut,
     *     false otherwise.
     * @package
     */
    Blockly.FieldColour.prototype.onShortcut = function(shortcut) {
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
      return Blockly.FieldColour.superClass_.onShortcut.call(this, shortcut);
    };
  }

  /**
   * Adds method to handle keyboard shortcuts to the dropdown field.
   * No-op if the dropdown field is not available.
   * @protected
   */
  addFieldDropdownShortcutHandler_() {
    if (!Blockly.FieldDropdown) {
      return;
    }
    /**
     * Handles the given keyboard shortcut.
     * This is only triggered when keyboard accessibility mode is enabled.
     * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut
     *     to be handled.
     * @return {boolean} True if the field handled the shortcut,
     *     false otherwise.
     * @package
     */
    Blockly.FieldDropdown.prototype.onShortcut = function(shortcut) {
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
      return Blockly.FieldDropdown.superClass_.onShortcut.call(this, shortcut);
    };
  }

  /**
   * Adds method to handle keyboard shortcuts to the toolbox.
   * No-op if the default toolbox available.
   * @protected
   */
  addToolboxShortcutHandler_() {
    if (!Blockly.Toolbox) {
      return;
    }
    /**
     * Handles the given keyboard shortcut.
     * This is only triggered when keyboard accessibility mode is enabled.
     * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut
     *     to be handled.
     * @return {boolean} True if the field handled the shortcut,
     *     false otherwise.
     * @package
     */
    Blockly.Toolbox.prototype.onShortcut = function(shortcut) {
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
