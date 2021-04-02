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
// TODO: Rename plugin and edit plugin description.
/**
 * Plugin description.
 */
export class HeavyTextCategory extends Blockly.ToolboxCategory {
  /**
   * Constructor for ...
   * @param {!Blockly.WorkspaceSvg} workspace The workspace that the plugin will
   *     be added to.
   */
  constructor(categoryDef, toolbox, opt_parent) {
    super(categoryDef, toolbox, opt_parent);
  }

  createDom_() {
    this.htmlDiv_ = this.createContainer_();
    Blockly.utils.aria.setRole(this.htmlDiv_, Blockly.utils.aria.Role.TREEITEM);
    Blockly.utils.aria.setState(/** @type {!Element} */ (this.htmlDiv_),
        Blockly.utils.aria.State.SELECTED,false);
    Blockly.utils.aria.setState(/** @type {!Element} */ (this.htmlDiv_),
        Blockly.utils.aria.State.LEVEL, this.level_);

    this.rowDiv_ = this.createRowContainer_();
    this.rowDiv_.style.pointerEvents = 'auto';
    this.htmlDiv_.appendChild(this.rowDiv_);

    this.rowContents_ = this.createRowContentsContainer_();
    this.rowContents_.style.pointerEvents = 'none';
    this.rowDiv_.appendChild(this.rowContents_);

    this.labelDom_ = this.createLabelDom_(this.name_);
    this.rowContents_.appendChild(this.labelDom_);

    this.explanationDom_ = this.createExplanationDom_();
    this.rowContents_.appendChild(this.explanationDom_);

    Blockly.utils.aria.setState(/** @type {!Element} */ (this.htmlDiv_),
        Blockly.utils.aria.State.LABELLEDBY, this.labelDom_.getAttribute('id'));

    this.addColourBorder_(this.colour_);

    return this.htmlDiv_;
  }

  createExplanationDom_() {
    const nameDom = document.createElement('p');
    nameDom.className = 'explanationClass';
    nameDom.textContent = this.toolboxItemDef_['explanation'];
    return nameDom;
  }
}
/**
 * CSS for Toolbox.  See css.js for use.
 */
 Blockly.Css.register([
`
    .blocklyTreeRow {
      height: auto;
      margin-left: 1.5em;
      max-width: 200px;
      white-space: normal;
      margin-top: 1em;
    }

    .blocklyTreeLabel {
      font-weight: 500;
    }

    .explanationClass {
      overflow-wrap: anywhere;
      margin: 0px;
      font-size: .85em;
    }
`]);


Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName, HeavyTextCategory, true);
