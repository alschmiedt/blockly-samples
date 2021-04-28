/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import '../src/index';
import '../src/collapsible_category';
import '../src/search_item';

import {createPlayground} from '@blockly/dev-tools';
import * as Blockly from 'blockly';

import {TinyCategory} from '../src/tiny_category';
import {TinyCollapsible} from '../src/tiny_collapsible_category';

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @return {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  // options['theme'] = Blockly.Theme.defineTheme('toolboxDemo', {
  //   base: 'classic',
  //   componentStyles: {
  //     'toolboxBackgroundColour': 'darkgray',
  //     'toolboxForegroundColour': 'white',
  //   },
  // });
  const workspace = Blockly.inject(blocklyDiv, options);
  return workspace;
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('button').addEventListener('click', function() {
    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.ToolboxCategory.registrationName, TinyCategory, true);

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.CollapsibleToolboxCategory.registrationName, TinyCollapsible,
        true);
    const workspace = Blockly.getMainWorkspace();
    workspace.updateToolbox(workspace.options.languageTree);
  });

  const defaultOptions = {
    toolbox: {
      'kind': 'categoryToolbox',
      'contents': [
        {
          'kind': 'category',
          'categorystyle': 'logic_category',
          'name': 'Parent Category',
          'cssConfig': {
            'icon': 'customIcon material-icons material-icons-outlined',
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
        {
          'kind': 'category',
          'categorystyle': 'text_category',
          'name': 'Parent Category',
          'cssConfig': {
            'icon': 'customIcon material-icons material-icons-outlined',
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
  createPlayground(
      document.getElementById('root'), createWorkspace, defaultOptions);
});
