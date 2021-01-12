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

import {AddOnShortcut} from './add_on_shortcut';
import * as Constants from './constants';
import {Navigation} from './navigation';

/**
 * Class for registering shortcuts for keyboard navigation.
 * TODO: I don't think this is a singleton anymore? Or shoudl be a singelton
 * anymore?
 */
export class Register {
  /**
   * Constructor used for registering shortcuts.
   * This will register any default shortcuts for keyboard navigation.
   * This is intended to be a singleton.
   * @param {!Navigation=} optNavigation The class that handles keyboard
   *     navigation actions. (Ex: inserting a block, focusing the flyout).
   * @param {!AddShortcutHandlers=} optShortcutHandler The class that handles
   *     adding methods to handle shortcuts to core Blockly classes.
   */
  constructor(optNavigation, optShortcutHandler) {
    /**
     * Handles any keyboard navigation actions.
     * @type {!Navigation}
     * @protected
     */
    this.navigation_ = optNavigation || new Navigation();

    /**
     * The object responsible for adding shortcuts.
     * @type {!AddShortcutHandlers}
     * @protected
     */
    this.shortcutHandler_ = optShortcutHandler || new AddOnShortcut();
  }

  /**
   * Registers the default keyboard shortcuts for keyboard navigation.
   */
  init() {
    this.registerDefaults_();
  }

  /**
   * Adds all necessary event listeners and markers to a workspace for keyboard
   * navigation to work. This must be called for keyboard navigation to work
   * on a workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to add keyboard
   *     navigation to.
   * @public
   */
  addWorkspace(workspace) {
    this.navigation_.addWorkspace(workspace);
  }

  /**
   * Keyboard shortcut to go to the previous location when in keyboard
   * navigation mode.
   * @protected
   */
  registerPrevious_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const previousShortcut = {
      name: Constants.ShortcutNames.PREVIOUS,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace, e, action) => {
        const flyout = workspace.getFlyout();
        const toolbox = workspace.getToolbox();
        let isHandled = false;
        switch (this.navigation_.getState(workspace)) {
          case Constants.State.WORKSPACE:
            isHandled = this.checkField_(workspace, action);
            if (!isHandled) {
              workspace.getCursor().prev();
              isHandled = true;
            }
            return isHandled;
          case Constants.State.FLYOUT:
            isHandled = this.checkField_(workspace, action);
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
   * Gives the cursor to the field to handle if the cursor is on a field.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to check.
   * @param {!Blockly.ShortcutRegistry.KeyboardShortcut} action The shortcut to
   *     give to the field.
   * @return {boolean} True if the action was handled by the field, false
   *     otherwise.
   * TODO: Fix this function name
   */
  checkField_(workspace, action) {
    const cursor = workspace.getCursor();
    if (!cursor || !cursor.getCurNode()) {
      return;
    }
    const curNode = cursor.getCurNode();
    if (curNode.getType() === Blockly.ASTNode.types.FIELD) {
      return (/** @type {!Blockly.Field} */ (curNode.getLocation()))
          .onShortcut(action);
    }
    return false;
  }

  /**
   * Keyboard shortcut to turn keyboard navigation on or off.
   * @protected
   */
  registerToggleKeyboardNav_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const toggleKeyboardNavShortcut = {
      name: Constants.ShortcutNames.TOGGLE_KEYBOARD_NAV,
      callback: (workspace) => {
        if (workspace.keyboardAccessibilityMode) {
          this.navigation_.disableKeyboardAccessibility(workspace);
        } else {
          this.navigation_.enableKeyboardAccessibility(workspace);
        }
        return true;
      },
    };

    Blockly.ShortcutRegistry.registry.register(toggleKeyboardNavShortcut);
    const ctrlShiftK = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.K,
        [Blockly.utils.KeyCodes.CTRL, Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        ctrlShiftK, toggleKeyboardNavShortcut.name);
  }

  /**
   * Keyboard shortcut to go to the out location when in keyboard navigation
   * mode.
   * @protected
   */
  registerOut_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const outShortcut = {
      name: Constants.ShortcutNames.OUT,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace, e, action) => {
        const toolbox = workspace.getToolbox();
        let isHandled = false;
        switch (this.navigation_.getState(workspace)) {
          case Constants.State.WORKSPACE:
            isHandled = this.checkField_(workspace, action);
            if (!isHandled) {
              workspace.getCursor().out();
              isHandled = true;
            }
            return isHandled;
          case Constants.State.FLYOUT:
            this.navigation_.focusToolbox(workspace);
            return true;
          case Constants.State.TOOLBOX:
            return toolbox && typeof toolbox.onShortcut == 'function' ?
                toolbox.onShortcut(action) :
                false;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(outShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.A, outShortcut.name);
  }

  /**
   * Keyboard shortcut to go to the next location when in keyboard navigation
   * mode.
   * @protected
   */
  registerNext_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const nextShortcut = {
      name: Constants.ShortcutNames.NEXT,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace, e, action) => {
        const toolbox = workspace.getToolbox();
        const flyout = workspace.getFlyout();
        let isHandled = false;
        switch (this.navigation_.getState(workspace)) {
          case Constants.State.WORKSPACE:
            isHandled = this.checkField_(workspace, action);
            if (!isHandled) {
              workspace.getCursor().next();
              isHandled = true;
            }
            return isHandled;
          case Constants.State.FLYOUT:
            isHandled = this.checkField_(workspace, action);
            if (!isHandled) {
              flyout.getWorkspace().getCursor().next();
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

    Blockly.ShortcutRegistry.registry.register(nextShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.S, nextShortcut.name);
  }

  /**
   * Keyboard shortcut to go to the in location when in keyboard navigation
   * mode.
   * @protected
   */
  registerIn_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const inShortcut = {
      name: Constants.ShortcutNames.IN,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace, e, action) => {
        const toolbox = workspace.getToolbox();
        let isHandled = false;
        switch (this.navigation_.getState(workspace)) {
          case Constants.State.WORKSPACE:
            isHandled = this.checkField_(workspace, action);
            if (!isHandled) {
              workspace.getCursor().in();
              isHandled = true;
            }
            return isHandled;
          case Constants.State.TOOLBOX:
            isHandled = toolbox && typeof toolbox.onShortcut == 'function' ?
                toolbox.onShortcut(action) :
                false;
            if (!isHandled) {
              this.navigation_.focusFlyout(workspace);
            }
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(inShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.D, inShortcut.name);
  }

  /**
   * Keyboard shortcut to connect a block to a marked location when in keyboard
   * navigation mode.
   * @protected
   */
  registerInsert_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const insertShortcut = {
      name: Constants.ShortcutNames.INSERT,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        switch (this.navigation_.getState(workspace)) {
          case Constants.State.WORKSPACE:
            return this.navigation_.connectMarkerAndCursor(workspace);
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(insertShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.I, insertShortcut.name);
  }

  /**
   * Keyboard shortcut to mark a location when in keyboard navigation mode.
   * @protected
   */
  registerMark_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const markShortcut = {
      name: Constants.ShortcutNames.MARK,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        switch (this.navigation_.getState(workspace)) {
          case Constants.State.WORKSPACE:
            this.navigation_.handleEnterForWS(workspace);
            return true;
          case Constants.State.FLYOUT:
            this.navigation_.insertFromFlyout(workspace);
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(markShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.ENTER, markShortcut.name);
  }

  /**
   * Keyboard shortcut to disconnect two blocks when in keyboard navigation
   * mode.
   * @protected
   */
  registerDisconnect_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const disconnectShortcut = {
      name: Constants.ShortcutNames.DISCONNECT,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        switch (this.navigation_.getState(workspace)) {
          case Constants.State.WORKSPACE:
            this.navigation_.disconnectBlocks(workspace);
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(disconnectShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.X, disconnectShortcut.name);
  }

  /**
   * Keyboard shortcut to focus on the toolbox when in keyboard navigation
   * mode.
   * @protected
   */
  registerToolboxFocus_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const focusToolboxShortcut = {
      name: Constants.ShortcutNames.TOOLBOX,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        switch (this.navigation_.getState(workspace)) {
          case Constants.State.WORKSPACE:
            if (!workspace.getToolbox()) {
              this.navigation_.focusFlyout(workspace);
            } else {
              this.navigation_.focusToolbox(workspace);
            }
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(focusToolboxShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.T, focusToolboxShortcut.name);
  }

  /**
   * Keyboard shortcut to exit the current location and focus on the workspace
   * when in keyboard navigation mode.
   * @protected
   */
  registerExit_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const exitShortcut = {
      name: Constants.ShortcutNames.EXIT,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace) => {
        switch (this.navigation_.getState(workspace)) {
          case Constants.State.FLYOUT:
            this.navigation_.focusWorkspace(workspace);
            return true;
          case Constants.State.TOOLBOX:
            this.navigation_.focusWorkspace(workspace);
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(exitShortcut, true);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.ESC, exitShortcut.name, true);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.E, exitShortcut.name, true);
  }

  /**
   * Keyboard shortcut to move the cursor on the workspace to the left when in
   * keyboard navigation mode.
   * @protected
   */
  registerWorkspaceMoveLeft_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const wsMoveLeftShortcut = {
      name: Constants.ShortcutNames.MOVE_WS_CURSOR_LEFT,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        return this.navigation_.moveWSCursor(workspace, -1, 0);
      },
    };

    Blockly.ShortcutRegistry.registry.register(wsMoveLeftShortcut);
    const shiftA = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.A, [Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        shiftA, wsMoveLeftShortcut.name);
  }

  /**
   * Keyboard shortcut to move the cursor on the workspace to the right when in
   * keyboard navigation mode.
   * @protected
   */
  registerWorkspaceMoveRight_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const wsMoveRightShortcut = {
      name: Constants.ShortcutNames.MOVE_WS_CURSOR_RIGHT,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        return this.navigation_.moveWSCursor(workspace, 1, 0);
      },
    };

    Blockly.ShortcutRegistry.registry.register(wsMoveRightShortcut);
    const shiftD = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.D, [Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        shiftD, wsMoveRightShortcut.name);
  }

  /**
   * Keyboard shortcut to move the cursor on the workspace up when in keyboard
   * navigation mode.
   * @protected
   */
  registerWorkspaceMoveUp_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const wsMoveUpShortcut = {
      name: Constants.ShortcutNames.MOVE_WS_CURSOR_UP,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        return this.navigation_.moveWSCursor(workspace, 0, -1);
      },
    };

    Blockly.ShortcutRegistry.registry.register(wsMoveUpShortcut);
    const shiftW = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.W, [Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        shiftW, wsMoveUpShortcut.name);
  }

  /**
   * Keyboard shortcut to move the cursor on the workspace down when in
   * keyboard navigation mode.
   * @protected
   */
  registerWorkspaceMoveDown_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const wsMoveDownShortcut = {
      name: Constants.ShortcutNames.MOVE_WS_CURSOR_DOWN,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        return this.navigation_.moveWSCursor(workspace, 0, 1);
      },
    };

    Blockly.ShortcutRegistry.registry.register(wsMoveDownShortcut);
    const shiftW = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.S, [Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        shiftW, wsMoveDownShortcut.name);
  }

  /**
   * Keyboard shortcut to copy the block the cursor is currently on.
   * @protected
   */
  registerCopy_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const copyShortcut = {
      name: Constants.ShortcutNames.COPY,
      preconditionFn: (workspace) => {
        if (workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly) {
          const curNode = workspace.getCursor().getCurNode();
          if (curNode && curNode.getSourceBlock()) {
            const sourceBlock = curNode.getSourceBlock();
            return !Blockly.Gesture.inProgress() && sourceBlock &&
                sourceBlock.isDeletable() && sourceBlock.isMovable();
          }
        }
        return false;
      },
      callback: (workspace) => {
        const sourceBlock = workspace.getCursor().getCurNode().getSourceBlock();
        Blockly.hideChaff();
        Blockly.copy(sourceBlock);
      },
    };

    Blockly.ShortcutRegistry.registry.register(copyShortcut);

    const ctrlC = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.C, [Blockly.utils.KeyCodes.CTRL]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        ctrlC, copyShortcut.name, true);

    const altC = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.C, [Blockly.utils.KeyCodes.ALT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        altC, copyShortcut.name, true);

    const metaC = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.C, [Blockly.utils.KeyCodes.META]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        metaC, copyShortcut.name, true);
  }

  /**
   * Register shortcut to paste the copied block to the marked location.
   * @protected
   */
  registerPaste_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const pasteShortcut = {
      name: Constants.ShortcutNames.PASTE,
      preconditionFn: (workspace) => {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly && !Blockly.Gesture.inProgress();
      },
      callback: () => {
        return this.navigation_.paste();
      },
    };

    Blockly.ShortcutRegistry.registry.register(pasteShortcut);

    const ctrlV = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.V, [Blockly.utils.KeyCodes.CTRL]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        ctrlV, pasteShortcut.name, true);

    const altV = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.V, [Blockly.utils.KeyCodes.ALT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        altV, pasteShortcut.name, true);

    const metaV = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.V, [Blockly.utils.KeyCodes.META]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        metaV, pasteShortcut.name, true);
  }

  /**
   * Keyboard shortcut to copy and delete the block the cursor is on using on
   * ctrl+x, cmd+x, or alt+x.
   * @protected
   */
  registerCut_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const cutShortcut = {
      name: Constants.ShortcutNames.CUT,
      preconditionFn: (workspace) => {
        if (workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly) {
          const curNode = workspace.getCursor().getCurNode();
          if (curNode && curNode.getSourceBlock()) {
            const sourceBlock = curNode.getSourceBlock();
            return !Blockly.Gesture.inProgress() && sourceBlock &&
                sourceBlock.isDeletable() && sourceBlock.isMovable() &&
                !sourceBlock.workspace.isFlyout;
          }
        }
        return false;
      },
      callback: (workspace) => {
        const sourceBlock = workspace.getCursor().getCurNode().getSourceBlock();
        Blockly.copy(sourceBlock);
        this.navigation_.moveCursorOnBlockDelete(workspace, sourceBlock);
        Blockly.deleteBlock(sourceBlock);
        return true;
      },
    };

    Blockly.ShortcutRegistry.registry.register(cutShortcut);

    const ctrlX = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.X, [Blockly.utils.KeyCodes.CTRL]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        ctrlX, cutShortcut.name, true);

    const altX = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.X, [Blockly.utils.KeyCodes.ALT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        altX, cutShortcut.name, true);

    const metaX = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.X, [Blockly.utils.KeyCodes.META]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        metaX, cutShortcut.name, true);
  }

  /**
   * Registers shortcut to delete the block the cursor is on using delete or
   * backspace.
   * @protected
   */
  registerDelete_() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const deleteShortcut = {
      name: Constants.ShortcutNames.DELETE,
      preconditionFn: function(workspace) {
        if (workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly) {
          const curNode = workspace.getCursor().getCurNode();
          if (curNode && curNode.getSourceBlock()) {
            const sourceBlock = curNode.getSourceBlock();
            return sourceBlock && sourceBlock.isDeletable();
          }
        }
        return false;
      },
      callback: (workspace, e) => {
        const sourceBlock = workspace.getCursor().getCurNode().getSourceBlock();
        // Delete or backspace.
        // Stop the browser from going back to the previous page.
        // Do this first to prevent an error in the delete code from resulting
        // in data loss.
        e.preventDefault();
        // Don't delete while dragging.  Jeez.
        if (Blockly.Gesture.inProgress()) {
          return false;
        }
        this.navigation_.moveCursorOnBlockDelete(workspace, sourceBlock);
        Blockly.deleteBlock(sourceBlock);
        return true;
      },
    };
    Blockly.ShortcutRegistry.registry.register(deleteShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.DELETE, deleteShortcut.name, true);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.BACKSPACE, deleteShortcut.name, true);
  }

  /**
   * Removes all the keyboard shortcuts.
   */
  dispose() {
    const shortcutNames = Object.values(Constants.ShortcutNames);
    for (const name of shortcutNames) {
      Blockly.ShortcutRegistry.registry.unregister(name);
    }
    this.navigation_.dispose();
  }

  /**
   * Registers all default keyboard shortcut items for keyboard navigation. This
   * should be called once per instance of KeyboardShortcutRegistry.
   * @protected
   */
  registerDefaults_() {
    this.registerPrevious_();
    this.registerNext_();
    this.registerIn_();
    this.registerOut_();

    this.registerDisconnect_();
    this.registerExit_();
    this.registerInsert_();
    this.registerMark_();
    this.registerToolboxFocus_();
    this.registerToggleKeyboardNav_();

    this.registerWorkspaceMoveDown_();
    this.registerWorkspaceMoveLeft_();
    this.registerWorkspaceMoveUp_();
    this.registerWorkspaceMoveRight_();

    // TODO: Check all of these. with tests. lots of tests.
    this.registerCopy_();
    this.registerPaste_();
    this.registerCut_();
    this.registerDelete_();
  }
}

export const defaultRegister = new Register();
