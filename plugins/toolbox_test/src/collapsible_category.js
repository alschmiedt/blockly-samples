/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Edit plugin overview.
/**
 * @fileoverview Plugin overview.
 */

import * as Blockly from 'blockly';


export class HeavyTextCategory extends Blockly.CollapsibleToolboxCategory {
  constructor(categoryDef, toolbox, opt_parent) {
    super(categoryDef, toolbox, opt_parent);
  }

  openIcon_(iconDiv) {
    if (!iconDiv) {
      return;
    }
    iconDiv.textContent = '&#xe5cf';
  }

  closeIcon_(iconDiv) {
    if (!iconDiv) {
      return;
    }
    iconDiv.textContent = '&#xe5ce';
  }
}



Blockly.Css.register([`
    .customIcon {
        float:right;
    }
`]);

Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.CollapsibleToolboxCategory.registrationName, HeavyTextCategory,
    true);
