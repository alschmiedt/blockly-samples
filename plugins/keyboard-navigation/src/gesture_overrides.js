/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Overrides methods on Gesture in order to allow a user to shift
 * click on a workspace when in keyboard accessibility mode. This is temporary
 * until we can look into creating a way to override Blockly.Gesture in core.
 * // TODO: Add a TODO with an issue.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

const oldDoWorkspaceClick = Blockly.Gesture.prototype.doWorkspaceClick_;

Blockly.Gesture.prototype.doWorkspaceClick_ = function(e) {
  const ws = this.creatorWorkspace_;
  // TODO: This seems like bad juju
  oldDoWorkspaceClick.bind(this)(e);
  if (e.shiftKey && ws.keyboardAccessibilityMode) {
    const screenCoord = new Blockly.utils.Coordinate(e.clientX, e.clientY);
    const wsCoord = Blockly.utils.screenToWsCoordinates(ws, screenCoord);
    const wsNode = Blockly.ASTNode.createWorkspaceNode(ws, wsCoord);
    ws.getCursor().setCurNode(wsNode);
  }
};

const oldDoBlockClick = Blockly.Gesture.prototype.doBlockClick_;
Blockly.Gesture.prototype.doBlockClick_ = function(e) {
  oldDoBlockClick.bind(this)(e);
  if (!this.targetBlock_.isInFlyout && this.mostRecentEvent_.shiftKey &&
      this.targetBlock_.workspace.keyboardAccessibilityMode) {
    this.creatorWorkspace_.getCursor().setCurNode(
        Blockly.ASTNode.createTopNode(this.targetBlock_));
  }
};

