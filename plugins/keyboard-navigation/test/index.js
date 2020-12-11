/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories, createPlayground} from '@blockly/dev-tools';
import {Register, LineCursorPluginInfo} from '../src/index.js';
import {TestNavigation} from './test_navigation';
import {TestToolbox} from './test_toolbox';

let registration;
// TODO: There should only be one import.
/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @return {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  const workspace = Blockly.inject(blocklyDiv, options);
  registration.addWorkspace(workspace);
  // registration.dispose();
  return workspace;
}

document.addEventListener('DOMContentLoaded', function() {
  registration = new Register();
  registration.init();
  const defaultOptions = {
    toolbox: toolboxCategories,
  };
  createPlayground(document.getElementById('root'), createWorkspace,
      defaultOptions);
});

