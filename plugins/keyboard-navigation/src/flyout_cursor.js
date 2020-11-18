/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview The class representing a cursor used to navigate the flyout.
 * Used primarily for keyboard navigation.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */
'use strict';

import * as Blockly from 'blockly/core';
import * as Constants from './constants';

/**
 * Class for a flyout cursor.
 * This controls how a user navigates blocks in the flyout.
 * This cursor only navigates stacks of blocks.
 * @constructor
 * @extends {Blockly.Cursor}
 */
export class FlyoutCursor extends Blockly.Cursor {
  /**
   * The constructor for the FlyoutCursor.
   */
  constructor() {
    super();
  }

  /**
   * Find the next stack of blocks.
   * @return {Blockly.ASTNode} The next element, or null if the current node is
   *     not set or there is no next value.
   * @override
   */
  next() {
    const curNode = this.getCurNode();
    if (!curNode) {
      return null;
    }
    const newNode = curNode.next();

    if (newNode) {
      this.setCurNode(newNode);
    }
    return newNode;
  }

  /**
   * This is a  no-op since a flyout cursor can not go in.
   * @return {null} Always null.
   * @override
   */
  in() {
    return null;
  }

  /**
   * Find the previous stack of blocks.
   * @return {Blockly.ASTNode} The previous element, or null if the current node
   *     is not set or there is no previous value.
   * @override
   */
  prev() {
    const curNode = this.getCurNode();
    if (!curNode) {
      return null;
    }
    const newNode = curNode.prev();

    if (newNode) {
      this.setCurNode(newNode);
    }
    return newNode;
  }

  /**
   * This is a  no-op since a flyout cursor can not go out.
   * @return {null} Always null.
   * @override
   */
  out() {
    return null;
  }

  /**
   * Handles the given shortcut.
   * This is only triggered when keyboard navigation is enabled.
   * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} shortcut The shortcut
   *     to be handled.
   * @return {boolean} True if the shortcut has been handled, false otherwise.
   * @override
   */
  onBlocklyAction(shortcut) {
    switch (shortcut.name) {
      case Constants.ShortcutNames.PREVIOUS:
        this.prev();
        return true;
      case Constants.ShortcutNames.NEXT:
        this.next();
        return true;
      default:
        return false;
    }
  }
}
