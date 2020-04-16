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
import {ShortcutModal} from './ShortcutModal.js';

/**
 * Plugin description.
 */
export class AccessibilityModal extends Modal {
  /**
   * Constructor for ...
   * @param {!Blockly.WorkspaceSvg} workspace The workspace that the plugin will
   *     be added to.
   */
  constructor(workspace) {
    super('', workspace);
    
  }

  /**
   * Initialize.
   */
  init() {
    super.init();
    const body = document.getElementsByTagName('body')[0];
    const div = document.createElement('div');
    div.className = 'screen-reader screen-reader-focusable';
    div.tabIndex = '0';
    div.onfocus = (e) => {
      this.show();
    }
    body.prepend(div);  
  }
  renderHeader_() {

  }

  renderContent_(contentContainer) {
    const container = document.createElement('div');
    container.className = 'shortcutModalContainer';

    const shortcutBtn = this.createBtn_('Keyboard Shortcuts', (e) => {
      const shorcutModal = new ShortcutModal(this.workspace_);
      shorcutModal.init();
      shorcutModal.show();
      this.dispose();
    });

    const wsBtn = this.createBtn_('Go To Workspace', (e) => {
      console.log("GO TO WORKSPACE");
      Blockly.navigation.enableKeyboardAccessibility();
    });
    container.appendChild(shortcutBtn);
    container.appendChild(wsBtn);
    contentContainer.appendChild(container);
  }

  createBtn_(text, onClick) {
    const button = document.createElement('button');
    button.className = 'kbMenuBtn';
    button.textContent = text;
    this.addEvent_(button, 'click', this, onClick); 
    return button;
  }
}

Blockly.Css.register([`
  .shortcutModalContainer {
    display: flex;
  }
  .kbMenuBtn {
    padding: 1em;
    background-color: transparent;
    font-weight: 300;
    font-size: 1em;
    margin: 1em;
  }
  .kbMenuBtn:focus {
    background-color: #ededed;
  }`
]);

