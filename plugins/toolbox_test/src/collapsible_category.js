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


export class HeavyTextCollapsibleCategory extends Blockly.CollapsibleToolboxCategory {
  constructor(categoryDef, toolbox, opt_parent) {
    super(categoryDef, toolbox, opt_parent);
  }

  createDom_() {
    super.createDom_();
    const dot = document.createElement('span');
    dot.innerHTML = '&#xe061;';
    dot.classList.add('material-icons');
    dot.style.fontSize = '10px';
    dot.style.color = this.colour_;
    this.rowContents_.insertBefore(dot, this.iconDom_);
  }

  openIcon_(iconDiv) {
    if (!iconDiv) {
      return;
    }
    iconDiv.innerHTML = '&#xe5cf;';
  }

  closeIcon_(iconDiv) {
    if (!iconDiv) {
      return;
    }
    iconDiv.innerHTML = '&#xe5ce;';
  }

  addColourBorder_() {}
  /** @override */
  setSelected(isSelected) {
    if (isSelected) {
      this.rowDiv_.style.backgroundColor = 'gray';
      Blockly.utils.dom.addClass(this.rowDiv_, this.cssConfig_['selected']);
    } else {
      this.rowDiv_.style.backgroundColor = '';
      Blockly.utils.dom.removeClass(this.rowDiv_, this.cssConfig_['selected']);
    }
    Blockly.utils.aria.setState(/** @type {!Element} */ (this.htmlDiv_),
        Blockly.utils.aria.State.SELECTED, isSelected);
  }
}


Blockly.Css.register([`
    .customIcon {
        float:right;
    }
`]);

Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.CollapsibleToolboxCategory.registrationName, HeavyTextCollapsibleCategory,
    true);
