/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories} from '@blockly/dev-tools';
import {AccessibilityModal} from '../src/index';

/**
 * Test page startup, sets up Blockly.
 */
function start() {
  const workspace = Blockly.inject('blocklyDiv', {
    toolbox: toolboxCategories,
  });

  // TODO: Initialize your plugin here.
  const plugin = new AccessibilityModal(workspace);
  plugin.init();
}

document.addEventListener('DOMContentLoaded', start);
