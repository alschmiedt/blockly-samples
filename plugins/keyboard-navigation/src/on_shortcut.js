/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Adds onBlocklyAction methods to fields, toolbox and flyout.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import * as Constants from '../src/constants';


/**
 * Handles the given action.
 * This is only triggered when keyboard accessibility mode is enabled.
 * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut to
 * be handled.
 * @return {boolean} True if the field handled the action, false otherwise.
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

/**
 * Handles the given action.
 * This is only triggered when keyboard accessibility mode is enabled.
 * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut to
 *     be handled.
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

/**
 * Handles the given action.
 * This is only triggered when keyboard accessibility mode is enabled.
 * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut to
 *     be handled.
 * @return {boolean} True if the field handled the action, false otherwise.
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


/**
 * Handles the given Blockly action on a toolbox.
 * This is only triggered when keyboard accessibility mode is enabled.
 * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut to
 *     be handled.
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

/**
 * Handles the given action.
 * This is only triggered when keyboard accessibility mode is enabled.
 * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The action to be
 *     handled.
 * @return {boolean} True if the flyout handled the action, false otherwise.
 * @package
 */
Blockly.Flyout.prototype.onBlocklyAction = function(shortcut) {
  return this.workspace_.getCursor().onBlocklyAction(shortcut);
};

/**
 * Handles the given action.
 * This is only triggered when keyboard navigation is enabled.
 * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut to
 *     be handled.
 * @return {boolean} True if the action has been handled, false otherwise.
 * TODO: Should this be shortcut or action.
 */
Blockly.Cursor.prototype.onBlocklyAction = function(shortcut) {
  // If we are on a field give it the option to handle the action
  if (this.getCurNode() &&
      this.getCurNode().getType() === Blockly.ASTNode.types.FIELD &&
      (/** @type {!Blockly.Field} */ (this.getCurNode().getLocation()))
          .onBlocklyAction(shortcut)) {
    return true;
  }
  switch (shortcut.name) {
    case Blockly.navigation.actionNames.PREVIOUS:
      this.prev();
      return true;
    case Blockly.navigation.actionNames.OUT:
      this.out();
      return true;
    case Blockly.navigation.actionNames.NEXT:
      this.next();
      return true;
    case Blockly.navigation.actionNames.IN:
      this.in();
      return true;
    default:
      return false;
  }
};
