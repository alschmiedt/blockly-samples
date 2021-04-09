/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: Edit plugin overview.
/**
 * @fileoverview Plugin overview.
 */

// TODO: Rename plugin and edit plugin description.
/**
 * Plugin description.
 */
export class Plugin {
  /**
   * Constructor for ...
   * @param {!Blockly.WorkspaceSvg} workspace The workspace that the plugin will
   *     be added to.
   */
  constructor(workspace) {
    /**
     * The workspace.
     * TODO: How do we want to set this up? Should it just be on all workspaces?
     * TODO: Should it just be a function that I can export?
     * @type {!Blockly.WorkspaceSvg}
     * @protected
     */
    this.workspace_ = workspace;
  }

  /**
   * Initialize.
   */
  init() {
    Blockly.bindEventWithChecks_(
        this.workspace_.svgGroup_, 'wheel', this, this.onMouseWheel_);
  }

  onMouseWheel_(e) {
    console.log('HERE');
    e.stopPropagation();
  }
}
