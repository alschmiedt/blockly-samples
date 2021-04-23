/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories, createPlayground} from '@blockly/dev-tools';
import {Plugin} from '../src/index';
import {ScrollBlockDragger} from '../src/ScrollBlockDragger';


/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @return {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  const workspace = Blockly.inject(blocklyDiv, options);

  // TODO: Initialize your plugin here.
  const plugin = new Plugin(workspace);
  plugin.init();

  return workspace;
}

document.addEventListener('DOMContentLoaded', function() {
  const defaultOptions = {
    toolbox: toolboxCategories,
    plugins: {
      'blockDragger': ScrollBlockDragger,
    },
  };
  createPlayground(document.getElementById('root'), createWorkspace,
      defaultOptions);
});
