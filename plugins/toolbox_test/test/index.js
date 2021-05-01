/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import '../src/index';
import '../src/search_item';
import '../src/collapse_item';

import {createPlayground} from '@blockly/dev-tools';
import * as Blockly from 'blockly';


/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @return {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  const workspace = Blockly.inject(blocklyDiv, options);
  return workspace;
}

document.addEventListener('DOMContentLoaded', function() {
  const defaultOptions = {
    toolbox: {
      'kind': 'categoryToolbox',
      'contents': [
        {
          'kind': 'collapseIcon',
        },
        {
          'kind': 'searchItem',
        },
        {
          'kind': 'category',
          'name': 'List',
          'explanation': 'A longer explanation of list blocks.',
          'contents': [
            {
              'kind': 'block',
              'type': 'controls_ifelse',
            },
            {
              'kind': 'block',
              'type': 'logic_operation',
            },
          ],
        },
        {
          'kind': 'category',
          'name': 'Loops',
          'explanation': 'A longer explanation of loop blocks.',
          'contents': [
            {
              'kind': 'block',
              'type': 'controls_ifelse',
            },
          ],
        },
      ],
    },
  };
  createPlayground(
      document.getElementById('root'), createWorkspace, defaultOptions);
});
