/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import {createPlayground, toolboxCategories} from '@blockly/dev-tools';
import * as Blockly from 'blockly';

import {LineCursor, KeyboardNavigation} from '../src';


let registration;

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @return {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  const workspace = Blockly.inject(blocklyDiv, options);
  registration.addWorkspace(workspace);
  return workspace;
}

document.addEventListener('DOMContentLoaded', function() {
  registration = new KeyboardNavigation();
  registration.init();
  const defaultOptions = {
    toolbox: toolboxCategories,
  };
  createPlayground(
      document.getElementById('root'), createWorkspace, defaultOptions);
});

document.getElementById('accessibilityModeCheck')
    .addEventListener('click', (e) => {
      if (e.target.checked) {
        registration.navigationHelper.enableKeyboardAccessibility(
            Blockly.getMainWorkspace());
      } else {
        registration.navigationHelper.disableKeyboardAccessibility(
            Blockly.getMainWorkspace());
      }
    });

document.getElementById('cursorChanger').addEventListener('change', (e) => {
  const cursorType = e.target.value;
  const accessibilityCheckbox =
      document.getElementById('accessibilityModeCheck');
  const markerManager = Blockly.getMainWorkspace().getMarkerManager();
  const oldCurNode = markerManager.getCursor().getCurNode();

  document.getElementById('cursorChanger').value = cursorType;
  if (cursorType === 'basic') {
    Blockly.ASTNode.NAVIGATE_ALL_FIELDS = false;
    markerManager.setCursor(new Blockly.BasicCursor());
  } else if (cursorType === 'line') {
    Blockly.ASTNode.NAVIGATE_ALL_FIELDS = true;
    markerManager.setCursor(new LineCursor());
  } else {
    Blockly.ASTNode.NAVIGATE_ALL_FIELDS = false;
    markerManager.setCursor(new Blockly.Cursor());
  }
  if (oldCurNode) {
    markerManager.getCursor().setCurNode(oldCurNode);
  }

  if (!accessibilityCheckbox.checked) {
    accessibilityCheckbox.checked = true;
    registration.navigationHelper.enableKeyboardAccessibility(
        Blockly.getMainWorkspace());
  }

  document.activeElement.blur();
});
