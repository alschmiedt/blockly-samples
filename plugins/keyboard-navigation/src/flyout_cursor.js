/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview The class representing a cursor used to navigate the flyout.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */
'use strict';

import * as Blockly from 'blockly/core';

/**
 * Class for a flyout cursor.
 * This controls how a user navigates blocks in the flyout.
 * This cursor only allows a user to go to the previous or next location.
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
   * This is a no-op since a flyout cursor can not go in.
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
}

/**
 * Name used for registering a flyout cursor.
 * TODO: Should this be exported in index.js?
 * @const {string}
 */
export const registrationName = 'FlyoutCursor';

/**
 * The type used for registering a flyout cursor.
 * @const {!Blockly.registry.Type<T>}
 */
export const registrationType = Blockly.registry.Type.CURSOR;

Blockly.registry.register(registrationType, registrationName, FlyoutCursor);
