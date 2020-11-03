/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Constants for keyboard navigation.
 */

/**
 * Object holding possible states for navigation.
 * @enum {string}
 */
export const State = {
  WORKSPACE: 'workspace',
  FLYOUT: 'flyout',
  TOOLBOX: 'toolbox',
};

/**
 * Object holding default shortcut names.
 * TODO: How to reconcile this with onBlocklyAction.
 * TODO: How would someone override these values if they are not on the class?
 * TODO: Update move ws cursor names.
 * @enum {string}
 */
export const ShortcutNames = {
  PREVIOUS: 'previous',
  NEXT: 'next',
  IN: 'in',
  OUT: 'out',
  INSERT: 'insert',
  MARK: 'mark',
  DISCONNECT: 'disconnect',
  TOOLBOX: 'toolbox',
  EXIT: 'exit',
  TOGGLE_KEYBOARD_NAV: 'toggle_keyboard_nav',
  COPY: 'keyboard_nav_copy',
  CUT: 'keyboard_nav_cut',
  PASTE: 'keyboard_nav_paste',
  DELETE: 'keyboard_nav_delete',
  MOVE_WS_CURSOR_UP: 'move workspace cursor up',
  MOVE_WS_CURSOR_DOWN: 'move workspace cursor down',
  MOVE_WS_CURSOR_LEFT: 'move workspace cursor left',
  MOVE_WS_CURSOR_RIGHT: 'move workspace cursor right',
};

export const MarkerName = 'local_marker_1';

/**
 * The distance to move the cursor on the workspace.
 * @type {number}
 * @const
 */
export const WS_MOVE_DISTANCE = 40;
