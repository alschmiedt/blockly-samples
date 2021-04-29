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

import {HeavyTextCollapsibleCategory} from '../src/collapsible_category';
import {HeavyTextCategory} from '../src/index';
import {TinyCategory} from '../src/tiny_category';
import {TinyCollapsible} from '../src/tiny_collapsible_category';


export class CollapseIcon extends Blockly.ToolboxItem {
  constructor(toolboxItemDef, toolbox, opt_parent) {
    super(toolboxItemDef, toolbox, opt_parent);
  }

  getDiv() {
    this.iconDiv = document.createElement('div');
    this.iconDiv.innerHTML = '&#xe5e1;';
    this.iconDiv.classList.add('material-icons');
    this.iconDiv.style.fontSize = '1em';
    return this.iconDiv;
  }

  isSelectable() {
    return true;
  }
  setSelected(isSelected) {
    return;
  }

  getClickTarget() {
    return this.iconDiv;
  }

  getContents() {
    return [];
  }

  getName() {
    return 'open';
  }
  onClick() {
    console.log('here');
    if (this.parentToolbox_.isClosed) {
      this.parentToolbox_.isClosed = false;
      this.collapseToolbox();
    } else {
      this.parentToolbox_.isClosed = true;
      this.openToolbox();
    }
  }

  dispose() {
    Blockly.utils.dom.removeNode(this.iconDiv);
  }

  collapseToolbox() {
    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.ToolboxCategory.registrationName, TinyCategory, true);

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.CollapsibleToolboxCategory.registrationName, TinyCollapsible,
        true);
    const workspace = Blockly.getMainWorkspace();
    workspace.updateToolbox(workspace.options.languageTree);
    this.iconDiv.innerHTML = '&#xe5e0;';
  }

  openToolbox() {
    console.log(HeavyTextCategory);
    console.log(HeavyTextCollapsibleCategory);
    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.ToolboxCategory.registrationName, HeavyTextCategory, true);

    Blockly.registry.register(
        Blockly.registry.Type.TOOLBOX_ITEM,
        Blockly.CollapsibleToolboxCategory.registrationName,
        HeavyTextCollapsibleCategory, true);
    const workspace = Blockly.getMainWorkspace();
    workspace.updateToolbox(workspace.options.languageTree);
    this.iconDiv.innerHTML = '&#xe5e1;';
  }
}


Blockly.Css.register([``]);

Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM, 'collapseIcon', CollapseIcon, true);
