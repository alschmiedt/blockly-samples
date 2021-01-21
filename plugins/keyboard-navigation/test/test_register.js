/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Registers all of the keyboard shortcuts that are necessary for
 * navigating blockly using the keyboard.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import '../src/gesture_monkey_patch';

import * as Blockly from 'blockly/core';

import Register from '../src/index';
import * as Constants from '../src/index';

/**
 * Class for registering shortcuts for keyboard navigation.
 */
export class TestRegister extends Register {
  /**
   * Constructor used for registering shortcuts.
   * This will register any default shortcuts for keyboard navigation.
   * This is intended to be a singleton.
   * @param {!Navigation=} optNavigation The class that handles keyboard
   *     navigation actions. (Ex: inserting a block, focusing the flyout).
   * @param {!AddOnShortcut=} optShortcutHandler The class that adds keyboard
   *    navigation shortcuts.
   */
  constructor(optNavigation, optShortcutHandler) {
    super();
  }

  /**
   * Keyboard shortcut to go to the previous location when in keyboard
   * navigation mode.
   * @protected
   */
  registerSomething_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const previousShortcut = {
      name: 'something',
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace, e, action) => {
        const flyout = workspace.getFlyout();
        const toolbox = workspace.getToolbox();
        let isHandled = false;
        switch (this.navigation.getState(workspace)) {
          case Constants.State.WORKSPACE:
            isHandled = this.fieldShortcutHandler(workspace, action);
            if (!isHandled) {
              workspace.getCursor().prev();
              isHandled = true;
            }
            return isHandled;
          case Constants.State.FLYOUT:
            isHandled = this.fieldShortcutHandler(workspace, action);
            if (!isHandled) {
              flyout.getWorkspace().getCursor().prev();
              isHandled = true;
            }
            return isHandled;
          case Constants.State.TOOLBOX:
            return toolbox && typeof toolbox.onShortcut == 'function' ?
                toolbox.onShortcut(action) :
                false;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(previousShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.W, previousShortcut.name);
  }

  /**
   * Registers all default keyboard shortcut items for keyboard navigation. This
   * should be called once per instance of KeyboardShortcutRegistry.
   * @protected
   */
  registerDefaults() {
    super.registerDefaults();
    this.registerSomething_();
  }
}
