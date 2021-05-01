/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Creates a category that holds an explanation of what is in the
 * category.
 */

import * as Blockly from 'blockly';


/**
 * Creates a category that has an explanation under the name.
 */
export class HeavyTextCategory extends Blockly.ToolboxCategory {
  /** @override */
  constructor(categoryDef, toolbox, opt_parent) {
    super(categoryDef, toolbox, opt_parent);
    Blockly.ToolboxCategory.nestedPadding = 0;
  }

  /** @override */
  createDom_() {
    this.htmlDiv_ = this.createContainer_();
    Blockly.utils.aria.setRole(this.htmlDiv_, Blockly.utils.aria.Role.TREEITEM);
    Blockly.utils.aria.setState(
        /** @type {!Element} */ (this.htmlDiv_),
        Blockly.utils.aria.State.SELECTED, false);
    Blockly.utils.aria.setState(
        /** @type {!Element} */ (this.htmlDiv_), Blockly.utils.aria.State.LEVEL,
        this.level_);

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

    Blockly.utils.aria.setState(
        /** @type {!Element} */ (this.htmlDiv_),
        Blockly.utils.aria.State.LABELLEDBY, this.labelDom_.getAttribute('id'));

    this.addColourBorder_(this.colour_);

    return this.htmlDiv_;
  }

  /**
   * Creates the element that holds the explanation.
   * @return {!Element} The paragraph element.
   * @protected
   */
  createExplanationDom_() {
    const nameDom = document.createElement('p');
    nameDom.className = 'explanationClass';
    nameDom.textContent = this.toolboxItemDef_['explanation'];
    return nameDom;
  }

  /** @override */
  addColourBorder_(colour) {}

  /** @override */
  setSelected(isSelected) {
    if (isSelected) {
      this.htmlDiv_.style.backgroundColor = 'gray';
      this.explanationDom_.style.color = 'white';
      Blockly.utils.dom.addClass(this.rowDiv_, this.cssConfig_['selected']);
    } else {
      this.htmlDiv_.style.backgroundColor = '';
      this.explanationDom_.style.color = 'black';
      Blockly.utils.dom.removeClass(this.rowDiv_, this.cssConfig_['selected']);
    }
    Blockly.utils.aria.setState(
        /** @type {!Element} */ (this.htmlDiv_),
        Blockly.utils.aria.State.SELECTED, isSelected);
  }
}

/**
 * CSS for the category.
 */
Blockly.Css.register([`
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


Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM,
    Blockly.ToolboxCategory.registrationName, HeavyTextCategory, true);
