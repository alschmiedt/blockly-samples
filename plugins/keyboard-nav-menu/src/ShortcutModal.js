/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Edit plugin overview.
/**
 * @fileoverview Plugin overview.
 */


import * as Blockly from 'blockly/core';
import {Modal} from './Modal.js';

/**
 * Plugin description.
 */
export class ShortcutModal extends Modal {
  /**
   * Constructor for ...
   * @param {!Blockly.WorkspaceSvg} workspace The workspace that the plugin will
   *     be added to.
   */
  constructor(workspace) {
    super('Keyboard Shortcut Menu', workspace);
    
    this.shouldCloseOnOverlayClick = false;
  }

  /**
   * Initialize.
   */
  init() {
    super.init();
    console.log(Blockly.user.keyMap.getKeyMap());
    this.show();
  }

  renderContent_(contentContainer) {
    const kbNavMenu = document.createElement('div');
    const kbNavCategory = this.createCategory_();
    contentContainer.appendChild(kbNavCategory);
  }

  createCategory_() {
    const kbNavCategory = document.createElement('div');
    kbNavCategory.className = 'kbNavCategory';
    const kbNavHeader = document.createElement('h2');
    kbNavHeader.className = 'kbNavHeader';
    kbNavHeader.textContent = 'All Shortcuts';
    kbNavCategory.appendChild(kbNavHeader);

    const kbNavTable = document.createElement('table');
    kbNavTable.className = 'kbNavTable';
    kbNavCategory.appendChild(kbNavTable);

    const kbNavBody = document.createElement('tbody');
    kbNavBody.className = 'kbNavBody';
    kbNavCategory.appendChild(kbNavBody);

    const keyMap = Blockly.user.keyMap.getKeyMap();
    const keys = Object.keys(keyMap);

    for (const key of keys) {
      const row = this.createRow_(key, keyMap[key]);
      kbNavBody.appendChild(row);
    }

    return kbNavCategory;
  }

  getReadableKey_(key) {
    const actionKeys = [];
    const modifierKeys = Object.values(Blockly.user.keyMap.modifierKeys);
    // TODO: Might want to look into adding spacer between keys
    for (const modifier of modifierKeys) {
      if (key.indexOf(modifier) > -1) {
        key = key.replace(modifier, "");
        actionKeys.push(modifier);
      }
    }

    var keyValue = String.fromCharCode(key);
    if (parseInt(key) === Blockly.utils.KeyCodes.ESC) {
        keyValue = 'Escape';
    } else if (parseInt(key) === Blockly.utils.KeyCodes.ENTER) {
      keyValue = 'Enter';
    }
    actionKeys.push(keyValue);
    return actionKeys.join('+');
  }

  createRow_(key, action) {
    const kbNavRow = document.createElement('tr');
    kbNavRow.className = 'kbNavRow';

    const kbNavKey = document.createElement('td');
    kbNavKey.className = 'kbNavCell kbNavKey';

    const kbNavKeyBkgrd = document.createElement('span');
    kbNavKeyBkgrd.className = 'kbNavKeyBkgrd';
    kbNavKeyBkgrd.textContent = this.getReadableKey_(key);
    kbNavKeyBkgrd.tabIndex = '0';

    kbNavKey.appendChild(kbNavKeyBkgrd);

    const kbNavDesc = document.createElement('td');
    kbNavDesc.className = 'kbNavCell kbNavDesc';
    kbNavDesc.textContent = action.desc;
    kbNavDesc.tabIndex = '0';
    kbNavRow.appendChild(kbNavKey);
    kbNavRow.appendChild(kbNavDesc);
    return kbNavRow;
  }
}

Blockly.Css.register([`
  h2 {
    font-size: 1em;
    color: gray;
  }
  .kbNavMenu {
    padding: 1em;
    font-family: sans-serif;
    font-weight: 300;
    max-width: 300px;
  }
  .kbNavCategory {
    
  }
  .kbNavTable {
    width: 100%;
  }
  .kbNavRow {
    display: flex;
  }
  .kbNavCell {
    display: flex;
    align-items: center;
    padding: .75em;
  }
  .kbNavSpacer {
    margin: 0 .25em 0 .25em;
  }
  .kbNavKeyBkgrd {
    background-color: #e8e8e8;
    padding: .25em;
  }
  .kbNavKey {
    padding-left: 0;
    padding-right: 0;
  }`
]);