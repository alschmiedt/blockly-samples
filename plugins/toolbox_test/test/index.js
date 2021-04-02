/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {createPlayground} from '@blockly/dev-tools';
import '../src/index';
import '../src/collapsible_category';

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
          'kind': 'category',
          'name': 'Parent Category',
          'cssConfig': {
            'icon': 'materials-icon material-icons-outlined',
          },
          'contents': [
            {
              'kind': 'category',
              'name': 'List',
              'explanation': 'All the blocks that have to do with ...',
            },
            {
              'kind': 'category',
              'name': 'List',
              'explanation': 'All the blocks that have to do with ...',
            },
          ],
        },
      ],
    },
  };
  createPlayground(document.getElementById('root'), createWorkspace,
      defaultOptions);
});
