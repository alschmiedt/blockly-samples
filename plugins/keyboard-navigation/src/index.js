/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview A plugin for adding keyboard navigation support.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import * as Constants from './constants';
import {FlyoutCursor} from './flyout_cursor';

/**
 * Class for keyboard navigation.
 */
export class Navigation {
  /**
   * Constructor for the keyboard navigation plugin.
   * This will register any default shortcuts for keyboard navigation.
   */
  constructor() {
    /**
     * Object holding the current location of the workspace's cursor.
     * (Ex: flyout, toolbox, workspace).
     * @type {Object<string,string>}
     * TODO: This should be <string, enum>
     * @protected
     */
    this.workspaceStates = {};

    /**
     * A function to call to give feedback to the user about logs, warnings, and
     * errors. You can override this to customize feedback.
     * (Ex: warning sounds, reading out the warning text, etc).
     * Null by default.
     * The first argument is one of 'log', 'warn', and 'error'.
     * The second argument is the message.
     * @type {?function(string, string)}
     * @public
     */
    this.loggingCallback = null;

    this.registerDefaults_();
  }

  /**
   * Adds all necessary event listeners and markers to a workspace for keyboard
   * navigation to work. This must be called for keyboard navigation to work
   * on a workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to add keyboard
   *     navigation to.
   */
  addWorkspace(workspace) {
    const flyout = workspace.getFlyout();
    workspace.getMarkerManager().registerMarker(Constants.MarkerName,
        new Blockly.Marker());

    workspace.addChangeListener((e) => this.workspaceChangeListener_(e));

    if (flyout) {
      const flyoutWorkspace = flyout.getWorkspace();
      flyoutWorkspace.addChangeListener(
          (e) => this.flyoutChangeListener_(e));
      flyoutWorkspace.getMarkerManager().setCursor(new FlyoutCursor());
    }
  }

  /**
   * Updates the state of keyboard navigation and the position of the cursor
   * based on workspace events.
   * @param {!Blockly.Events.Abstract} e The Blockly event to process.
   * @protected
   */
  workspaceChangeListener_(e) {
    const workspace = Blockly.Workspace.getById(e.workspaceId);
    const workspaceState = this.workspaceStates[workspace.id];
    if (workspace && workspace.keyboardAccessibilityMode) {
      if (e.type === Blockly.Events.DELETE) {
        this.deleteBlockOnDrag(e, workspace);
      } else if (e.type === Blockly.Events.CHANGE) {
        // TODO: Is the change from mutation -> mutate really important to break things.
        if (e.element === 'mutate') {
          this.moveCursorOnBlockMutation(workspace, e.blockId);
        } else if (e.element === 'field') {
          const sourceBlock = workspace.getBlockById(e.blockId);
          const field = sourceBlock.getField(e.name);
          this.updateMarkers_(
              sourceBlock, field.getCursorSvg(), field.getMarkerSvg());
        }
      } else if (e.type === Blockly.Events.CLICK) {
        if (workspaceState !== Constants.State.WORKSPACE) {
          this.resetFlyout_(workspace, !!workspace.getToolbox());
          this.setState(workspace, Constants.State.WORKSPACE);
        }
      } else if (e.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
        if (e.newItem && workspaceState !== Constants.State.TOOLBOX) {
          this.focusToolbox_(workspace);
        } else if (!e.newItem) {
          this.resetFlyout_(workspace, !!workspace.getToolbox());
          this.setState(workspace, Constants.State.WORKSPACE);
        }
      }
    }
  }

  // TODO: Clean this up/See if I can combine this with the other delete.
  deleteBlockOnDrag(e, workspace) {
    const deletedBlockId = e.blockId;
    const ids = e.ids;
    const cursor = workspace.getCursor();
    const curNode = workspace.getCursor().getCurNode();
    if (curNode && curNode.getSourceBlock()) {
      const sourceBlock = curNode.getSourceBlock();
      if (sourceBlock.id = deletedBlockId || ids.indexOf(sourceBlock.id) > -1) {
        cursor.setCurNode(Blockly.ASTNode.createWorkspaceNode(workspace,
            new Blockly.utils.Coordinate(100, 100)));
      }
    }
  }

  /**
   * Redraws any markers or cursors that are attached to the given block.
   * @param {!Blockly.BlockSvg} block The block the field is attached to.
   * @param {!Blockly.blockRendering.MarkerSvg} cursorSvg The svg of the cursor.
   * @param {!Blockly.blockRendering.MarkerSvg} markerSvg The svg of the marker.
   * @protected
   */
  updateMarkers_(block, cursorSvg, markerSvg) {
    const workspace = /** @type {!Blockly.WorkspaceSvg} */ (block.workspace);
    if (workspace.keyboardAccessibilityMode && cursorSvg) {
      workspace.getCursor().draw();
    }
    if (workspace.keyboardAccessibilityMode && markerSvg) {
      workspace.getMarker(Constants.MarkerName).draw();
    }
  }

  /**
   * Updates the state of keyboard navigation and the position of the cursor
   * based on events emitted from the workspace flyout.
   * @param {!Blockly.Events.Abstract} e The Blockly event to process.
   * @protected
   */
  flyoutChangeListener_(e) {
    const flyoutWorkspace = Blockly.Workspace.getById(e.workspaceId);
    const mainWorkspace = flyoutWorkspace.targetWorkspace;
    const flyout = mainWorkspace.getFlyout();
    if (flyout.autoClose) {
      return;
    }

    if (mainWorkspace && mainWorkspace.keyboardAccessibilityMode) {
      if ((e.type === Blockly.Events.CLICK && e.targetType === 'block')) {
        const block = flyoutWorkspace.getBlockById(e.blockId);
        flyoutWorkspace.getCursor().setCurNode(
            Blockly.ASTNode.createStackNode(block));
        this.setState(mainWorkspace, Constants.State.FLYOUT);
      }
    }
  }

  /**
   * Sets the state for the given workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to set the state on.
   * @param {string} state The navigation state.
   */
  setState(workspace, state) {
    this.workspaceStates[workspace.id] = state;
  }

  /**
   * Moves the cursor to the block level when the block the cursor is on is
   * mutated.
   * @param {Blockly.WorkspaceSvg} workspace The workspace the cursor is on.
   * @param {string} mutatedBlockId The id of the block being mutated.
   * @package
   */
  moveCursorOnBlockMutation(workspace, mutatedBlockId) {
    const cursor = workspace.getCursor();
    if (cursor) {
      const curNode = cursor.getCurNode();
      const block = curNode ? curNode.getSourceBlock() : null;
      if (block && block.id === mutatedBlockId) {
        cursor.setCurNode(Blockly.ASTNode.createBlockNode(block));
      }
    }
  }

  /**
   * Gets the marker on the given workspace created for keyboard navigation.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to get the marker
   *     from.
   * @return {Blockly.Marker} The marker created for keyboard navigation.
   * @protected
   */
  getMarker_(workspace) {
    return workspace.getMarker(Constants.MarkerName);
  }

  /**
   * Sets the navigation state to toolbox and selects the first category in the
   * toolbox. No-op if a toolbox does not exist on the given workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to get the toolbox
   *     on.
   * TODO: Should this be split up into multiple functions? Same for other focus methods?
   * @protected
   */
  focusToolbox_(workspace) {
    const toolbox = workspace.getToolbox();
    if (!toolbox) {
      return;
    }
    this.setState(workspace, Constants.State.TOOLBOX);
    this.resetFlyout_(workspace, false /* shouldHide */);

    if (!this.getMarker_(workspace).getCurNode()) {
      this.markAtCursor_(workspace);
    }
    if (!toolbox.getSelectedItem()) {
      // Find the first item that is selectable.
      const toolboxItems = toolbox.getToolboxItems();
      for (let i = 0, toolboxItem; (toolboxItem = toolboxItems[i]); i++) {
        if (toolboxItem.isSelectable()) {
          toolbox.selectItemByPosition(i);
          break;
        }
      }
    }
  }

  /**
   * Sets the navigation state to flyout and moves the cursor to the first
   * block in the flyout.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @protected
   */
  focusFlyout_(workspace) {
    const toolbox = workspace.getToolbox();
    const flyout = toolbox ? toolbox.getFlyout() : workspace.getFlyout();

    this.setState(workspace, Constants.State.FLYOUT);

    if (!this.getMarker_(workspace).getCurNode()) {
      this.markAtCursor_(workspace);
    }

    if (flyout && flyout.getWorkspace()) {
      const topBlocks = flyout.getWorkspace().getTopBlocks(true);
      if (topBlocks.length > 0) {
        const astNode = Blockly.ASTNode.createStackNode(topBlocks[0]);
        this.getFlyoutCursor_(workspace).setCurNode(astNode);
      }
    }
  }

  /**
   * Sets the navigation state to workspace and moves the cursor to either the
   * top block on a workspace or to the workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @protected
   */
  focusWorkspace_(workspace) {
    // TODO: This shouldn't focus on the top block. We should leave that decision up to the user?
    Blockly.hideChaff();
    const cursor = workspace.getCursor();
    const reset = !!workspace.getToolbox();
    const topBlocks = workspace.getTopBlocks(true);

    this.resetFlyout_(workspace, reset);
    this.workspaceStates[workspace.id] = Constants.State.WORKSPACE;
    if (topBlocks.length > 0) {
      cursor.setCurNode(Blockly.ASTNode.createTopNode(topBlocks[0]));
    } else {
      // TODO: Make this something that can be easily changed by the user.
      const wsCoord = new Blockly.utils.Coordinate(100, 100);
      const wsNode = Blockly.ASTNode.createWorkspaceNode(workspace, wsCoord);
      cursor.setCurNode(wsNode);
    }
  }


  /**
   * Gets the cursor on the flyout's workspace.
   * @return {Blockly.FlyoutCursor} The flyout's cursor or null if no flyout
   *     exists.
   * @param {!Blockly.WorkspaceSvg} workspace The main workspace the flyout is
   *     on.
   * @protected
   */
  getFlyoutCursor_(workspace) {
    const flyout = workspace.getFlyout();
    const cursor = flyout ? flyout.getWorkspace().getCursor() : null;

    return /** @type {Blockly.FlyoutCursor} */ (cursor);
  }

  /**
   * Inserts a block from the flyout.
   * If there is a marked connection try connecting the block from the flyout to
   * that connection. If no connection has been marked then inserting it will
   * place it on the workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The main workspace. The workspace
   *     the block will be placed on.
   * TODO: Possible helper method.
   */
  insertFromFlyout(workspace) {
    const flyout = workspace.getFlyout();
    if (!flyout || !flyout.isVisible()) {
      this.warn_('Trying to insert from the flyout when the flyout does not ' +
        ' exist or is not visible');
      return;
    }

    const curBlock = /** @type {!Blockly.BlockSvg} */ (
      this.getFlyoutCursor_(workspace).getCurNode().getLocation());
    if (!curBlock.isEnabled()) {
      this.warn_('Can\'t insert a disabled block.');
      return;
    }

    const newBlock = flyout.createBlock(curBlock);
    // Render to get the sizing right.
    newBlock.render();
    // Connections are not tracked when the block is first created.  Normally
    // there's enough time for them to become tracked in the user's mouse
    // movements, but not here.
    newBlock.setConnectionTracking(true);
    workspace.getCursor().setCurNode(
        Blockly.ASTNode.createBlockNode(newBlock));
    if (!this.modify_(workspace)) {
      this.warn_(
          'Something went wrong while inserting a block from the flyout.');
    }

    this.focusWorkspace_(workspace);
    workspace.getCursor().setCurNode(Blockly.ASTNode.createTopNode(newBlock));
    this.removeMark_(workspace);
  }

  /**
   * Hides the flyout cursor and optionally hides the flyout.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @param {boolean} shouldHide True if the flyout should be hidden.
   * @protected
   */
  resetFlyout_(workspace, shouldHide) {
    if (this.getFlyoutCursor_(workspace)) {
      this.getFlyoutCursor_(workspace).hide();
      if (shouldHide) {
        workspace.getFlyout().hide();
      }
    }
  }

  /**
   * Warns the user if the cursor or marker is on a type that can not be
   * connected.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @return {boolean} True if the marker and cursor are valid types, false
   *     otherwise.
   * @protected
   */
  modifyWarn_(workspace) {
    const markerNode = this.getMarker_(workspace).getCurNode();
    const cursorNode = workspace.getCursor().getCurNode();

    if (!markerNode) {
      this.warn_('Cannot insert with no marked node.');
      return false;
    }

    if (!cursorNode) {
      this.warn_('Cannot insert with no cursor node.');
      return false;
    }
    const markerType = markerNode.getType();
    const cursorType = cursorNode.getType();

    // Check the marker for invalid types.
    if (markerType == Blockly.ASTNode.types.FIELD) {
      this.warn_('Should not have been able to mark a field.');
      return false;
    } else if (markerType == Blockly.ASTNode.types.BLOCK) {
      this.warn_('Should not have been able to mark a block.');
      return false;
    } else if (markerType == Blockly.ASTNode.types.STACK) {
      this.warn_('Should not have been able to mark a stack.');
      return false;
    }

    // Check the cursor for invalid types.
    if (cursorType == Blockly.ASTNode.types.FIELD) {
      this.warn_('Cannot attach a field to anything else.');
      return false;
    } else if (cursorType == Blockly.ASTNode.types.WORKSPACE) {
      this.warn_('Cannot attach a workspace to anything else.');
      return false;
    }
    return true;
  }

  /**
   * Disconnect the block from its parent and move to the position of the
   * workspace node.
   * @param {Blockly.BlockSvg} block The block to be moved to the workspace.
   * @param {!Blockly.ASTNode} wsNode The workspace node holding the position
   *     the block will be moved to.
   * @return {boolean} True if the block can be moved to the workspace,
   *     false otherwise.
   * @protected
   * TODO: Possible helper method.
   */
  moveBlockToWorkspace_(block, wsNode) {
    if (!block) {
      return false;
    }
    if (block.isShadow()) {
      this.warn_('Cannot move a shadow block to the workspace.');
      return false;
    }
    if (block.getParent()) {
      block.unplug(false);
    }
    block.moveTo(wsNode.getWsCoordinate());
    return true;
  }

  /**
   * Tries to connect the current marker and cursor location. Warns the user if
   * the two locations can not be connected.
   * @param {!Blockly.WorkspaceSvg} workspace The main workspace.
   * @return {boolean} True if the key was handled; false if something went
   *     wrong.
   * @private
   */
  modify_(workspace) {
    const markerNode = this.getMarker_(workspace).getCurNode();
    const cursorNode = workspace.getCursor().getCurNode();
    if (!this.modifyWarn_(workspace)) {
      return false;
    }

    const markerType = markerNode.getType();
    const cursorType = cursorNode.getType();

    const cursorLoc = cursorNode.getLocation();
    const markerLoc = markerNode.getLocation();

    if (markerNode.isConnection() && cursorNode.isConnection()) {
      const cursorConnection =
      /** @type {!Blockly.RenderedConnection} */ (cursorLoc);
      const markerConnection =
      /** @type {!Blockly.RenderedConnection} */ (markerLoc);
      return this.connect_(cursorConnection, markerConnection);
    } else if (markerNode.isConnection() &&
        (cursorType == Blockly.ASTNode.types.BLOCK ||
        cursorType == Blockly.ASTNode.types.STACK)) {
      const cursorBlock = /** @type {!Blockly.BlockSvg} */ (cursorLoc);
      const markerConnection =
      /** @type {!Blockly.RenderedConnection} */ (markerLoc);
      return this.insertBlock(cursorBlock, markerConnection);
    } else if (markerType == Blockly.ASTNode.types.WORKSPACE) {
      const block = cursorNode ? cursorNode.getSourceBlock() : null;
      return this.moveBlockToWorkspace_(
          /** @type {Blockly.BlockSvg} */ (block), markerNode);
    }
    this.warn_('Unexpected state in modify_.');
    return false;
  }

  /**
   * Disconnects the child block from its parent block. No-op if the two given
   * connections are unrelated.
   * @param {!Blockly.RenderedConnection} movingConnection The connection that
   *     is being moved.
   * @param {!Blockly.RenderedConnection} destConnection The connection to be
   *     moved to.
   * @protected
   */
  disconnectChild_(movingConnection, destConnection) {
    const movingBlock = movingConnection.getSourceBlock();
    const destBlock = destConnection.getSourceBlock();

    if (movingBlock.getRootBlock() == destBlock.getRootBlock()) {
      if (movingBlock.getDescendants(false).indexOf(destBlock) > -1) {
        this.getInferiorConnection_(destConnection).disconnect();
      } else {
        this.getInferiorConnection_(movingConnection).disconnect();
      }
    }
  }

  /**
   * Moves the moving connection to the target connection and connects them.
   * @param {Blockly.RenderedConnection} movingConnection The connection that is
   *     being moved.
   * @param {Blockly.RenderedConnection} destConnection The connection to be
   *     moved to.
   * @return {boolean} True if the connections were connected, false otherwise.
   * @protected
   */
  moveAndConnect_(movingConnection, destConnection) {
    if (!movingConnection || !destConnection) {
      return false;
    }
    const movingBlock = movingConnection.getSourceBlock();
    const checker = movingConnection.getConnectionChecker();

    if (checker.canConnect(movingConnection, destConnection, false)) {
      this.disconnectChild_(movingConnection, destConnection);

      if (!destConnection.isSuperior()) {
        const rootBlock = movingBlock.getRootBlock();
        rootBlock.positionNearConnection(movingConnection, destConnection);
      }
      destConnection.connect(movingConnection);
      return true;
    }
    return false;
  }

  /**
   * If the given connection is superior find the inferior connection on the
   * source block.
   * @param {Blockly.RenderedConnection} connection The connection trying to be
   *     connected.
   * @return {Blockly.RenderedConnection} The inferior connection or null if
   *     none exists.
   * @protected
   * TODO: Possible helper method.
   */
  getInferiorConnection_(connection) {
    const block = connection.getSourceBlock();
    if (!connection.isSuperior()) {
      return connection;
    } else if (block.previousConnection) {
      return block.previousConnection;
    } else if (block.outputConnection) {
      return block.outputConnection;
    } else {
      return null;
    }
  }

  /**
   * If the given connection is inferior tries to find a superior connection to
   * connect to.
   * @param {Blockly.RenderedConnection} connection The connection trying to be
   *     connected.
   * @return {Blockly.RenderedConnection} The superior connection or null if
   *     none exists.
   * @protected
   * TODO: Possible helper method.
   */
  getSuperiorConnection_(connection) {
    if (connection.isSuperior()) {
      return connection;
    } else if (connection.targetConnection) {
      return connection.targetConnection;
    }
    return null;
  }

  /**
   * Tries to connect the  given connections.
   *
   * If the given connections are not compatible try finding compatible
   * connections on the source blocks of the given connections.
   *
   * @param {Blockly.RenderedConnection} movingConnection The connection that is
   *     being moved.
   * @param {Blockly.RenderedConnection} destConnection The connection to be
   *     moved to.
   * @return {boolean} True if the two connections or their target connections
   *     were connected, false otherwise.
   * @protected
   */
  connect_(movingConnection, destConnection) {
    if (!movingConnection || !destConnection) {
      return false;
    }

    const movingInferior = this.getInferiorConnection_(movingConnection);
    const destSuperior = this.getSuperiorConnection_(destConnection);

    const movingSuperior = this.getSuperiorConnection_(movingConnection);
    const destInferior = this.getInferiorConnection_(destConnection);

    if (movingInferior && destSuperior &&
        this.moveAndConnect_(movingInferior, destSuperior)) {
      return true;
    // Try swapping the inferior and superior connections on the blocks.
    } else if (movingSuperior && destInferior &&
        this.moveAndConnect_(movingSuperior, destInferior)) {
      return true;
    } else if (this.moveAndConnect_(movingConnection, destConnection)) {
      return true;
    } else {
      const checker = movingConnection.getConnectionChecker();
      const reason = checker.canConnectWithReason(
          movingConnection, destConnection, false);
      this.warn_('Connection failed with error: ' +
          checker.getErrorMessage(reason, movingConnection, destConnection));
      return false;
    }
  }

  /**
   * Tries to connect the given block to the destination connection, making an
   * intelligent guess about which connection to use to on the moving block.
   * @param {!Blockly.BlockSvg} block The block to move.
   * @param {!Blockly.RenderedConnection} destConnection The connection to
   *     connect to.
   * @return {boolean} Whether the connection was successful.
   * TODO: Possible helper method.
   */
  insertBlock(block, destConnection) {
    switch (destConnection.type) {
      case Blockly.PREVIOUS_STATEMENT:
        if (this.connect_(block.nextConnection, destConnection)) {
          return true;
        }
        break;
      case Blockly.NEXT_STATEMENT:
        if (this.connect_(block.previousConnection, destConnection)) {
          return true;
        }
        break;
      case Blockly.INPUT_VALUE:
        // TODO: Go through and figure out what methods are private.
        if (this.connect_(block.outputConnection, destConnection)) {
          return true;
        }
        break;
      case Blockly.OUTPUT_VALUE:
        for (let i = 0; i < block.inputList.length; i++) {
          const inputConnection = /** @type {Blockly.RenderedConnection} */ (
            block.inputList[i].connection);
          if (inputConnection && inputConnection.type === Blockly.INPUT_VALUE &&
              this.connect_(inputConnection, destConnection)) {
            return true;
          }
        }
        // If there are no input values pass the output and destination
        // connections to connect_ to find a way to connect the two.
        if (block.outputConnection &&
            this.connect_(block.outputConnection, destConnection)) {
          return true;
        }
        break;
    }
    this.warn_('This block can not be inserted at the marked location.');
    return false;
  }

  /**
   * Disconnect the connection that the cursor is pointing to, and bump blocks.
   * This is a no-op if the connection cannot be broken or if the cursor is not
   * pointing to a connection.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @protected
   */
  disconnectBlocks_(workspace) {
    const curNode = workspace.getCursor().getCurNode();
    if (!curNode.isConnection()) {
      this.log_(
          'Cannot disconnect blocks when the cursor is not on a connection');
      return;
    }
    const curConnection =
      /** @type {!Blockly.RenderedConnection} */ (curNode.getLocation());
    if (!curConnection.isConnected()) {
      this.log_('Cannot disconnect unconnected connection');
      return;
    }
    const superiorConnection =
        curConnection.isSuperior() ?
            curConnection : curConnection.targetConnection;

    const inferiorConnection =
        curConnection.isSuperior() ?
            curConnection.targetConnection : curConnection;

    if (inferiorConnection.getSourceBlock().isShadow()) {
      this.log_('Cannot disconnect a shadow block');
      return;
    }
    superiorConnection.disconnect();
    inferiorConnection.bumpAwayFrom(superiorConnection);

    const rootBlock = superiorConnection.getSourceBlock().getRootBlock();
    rootBlock.bringToFront();

    const connectionNode =
        Blockly.ASTNode.createConnectionNode(superiorConnection);
    workspace.getCursor().setCurNode(connectionNode);
  }

  /**
   * Moves the marker to the cursor's current location.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @protected
   */
  markAtCursor_(workspace) {
    this.getMarker_(workspace).setCurNode(workspace.getCursor().getCurNode());
  }

  /**
   * Removes the marker from its current location and hide it.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @private
   */
  removeMark_(workspace) {
    const marker = this.getMarker_(workspace);
    marker.setCurNode(null);
    marker.hide();
  }

  /**
   * Enables accessibility mode.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to enable keyboard
   *     accessibility on.
   */
  enableKeyboardAccessibility(workspace) {
    if (!workspace.keyboardAccessibilityMode) {
      workspace.keyboardAccessibilityMode = true;
      this.focusWorkspace_(workspace);
    }
  }

  /**
   * Disables accessibility mode.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to disable keyboard
   *     accessibility on.
   */
  disableKeyboardAccessibility(workspace) {
    if (workspace.keyboardAccessibilityMode) {
      workspace.keyboardAccessibilityMode = false;
      workspace.getCursor().hide();
      this.getMarker_(workspace).hide();
      if (this.getFlyoutCursor_(workspace)) {
        this.getFlyoutCursor_(workspace).hide();
      }
    }
  }

  /**
   * Navigation log handler. If loggingCallback is defined, use it.
   * Otherwise just log to the console.
   * @param {string} msg The message to log.
   * @private
   */
  log_(msg) {
    if (this.loggingCallback) {
      this.loggingCallback('log', msg);
    } else {
      console.log(msg);
    }
  }

  /**
   * Navigation warning handler. If loggingCallback is defined, use it.
   * Otherwise call warn_.
   * @param {string} msg The warning message.
   * @private
   */
  warn_(msg) {
    if (this.loggingCallback) {
      this.loggingCallback('warn', msg);
    } else {
      console.warn(msg);
    }
  }

  /**
   * Navigation error handler. If loggingCallback is defined, use it.
   * Otherwise call console.error.
   * @param {string} msg The error message.
   * @private
   */
  error_(msg) {
    if (this.loggingCallback) {
      this.loggingCallback('error', msg);
    } else {
      console.error(msg);
    }
  }

  /**
   * Moves the workspace cursor in the given direction.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the cursor is on.
   * @param {number} xDirection -1 to move cursor left. 1 to move cursor right.
   * @param {number} yDirection -1 to move cursor up. 1 to move cursor down.
   * @return {boolean} True if the current node is a workspace, false otherwise.
   * @protected
   */
  moveWSCursor_(workspace, xDirection, yDirection) {
    const cursor = workspace.getCursor();
    const curNode = workspace.getCursor().getCurNode();

    if (curNode.getType() !== Blockly.ASTNode.types.WORKSPACE) {
      return false;
    }

    const wsCoord = curNode.getWsCoordinate();
    const newX = xDirection * Constants.WS_MOVE_DISTANCE + wsCoord.x;
    const newY = yDirection * Constants.WS_MOVE_DISTANCE + wsCoord.y;

    cursor.setCurNode(Blockly.ASTNode.createWorkspaceNode(
        workspace, new Blockly.utils.Coordinate(newX, newY)));
    return true;
  }

  /**
   * Handles hitting the enter key on the workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @protected
   */
  handleEnterForWS_(workspace) {
    const cursor = workspace.getCursor();
    const curNode = cursor.getCurNode();
    const nodeType = curNode.getType();
    if (nodeType == Blockly.ASTNode.types.FIELD) {
      (/** @type {!Blockly.Field} */(curNode.getLocation())).showEditor();
    } else if (curNode.isConnection() ||
        nodeType == Blockly.ASTNode.types.WORKSPACE) {
      this.markAtCursor_(workspace);
    } else if (nodeType == Blockly.ASTNode.types.BLOCK) {
      this.warn_('Cannot mark a block.');
    } else if (nodeType == Blockly.ASTNode.types.STACK) {
      this.warn_('Cannot mark a stack.');
    }
  }

  /**
   * Keyboard shortcut to go to the previous location when in keyboard
   * navigation mode.
   */
  registerPrevious() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const previousShortcut = {
      name: Constants.ShortcutNames.PREVIOUS,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace, e, action) => {
        const flyout = workspace.getFlyout();
        const toolbox = workspace.getToolbox();
        switch (this.workspaceStates[workspace.id]) {
          case Constants.State.WORKSPACE:
            return workspace.getCursor().onBlocklyAction(action);
          case Constants.State.FLYOUT:
            return !!(flyout && flyout.onBlocklyAction(action));
          case Constants.State.TOOLBOX:
            return toolbox && typeof toolbox.onBlocklyAction == 'function' ?
                toolbox.onBlocklyAction(action) : false;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(previousShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.W, previousShortcut.name);
  }

  /** Keyboard shortcut to turn keyboard navigation on or off. */
  registerToggleKeyboardNav() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const toggleKeyboardNavShortcut = {
      name: Constants.ShortcutNames.TOGGLE_KEYBOARD_NAV,
      callback: (workspace) => {
        if (workspace.keyboardAccessibilityMode) {
          this.disableKeyboardAccessibility(workspace);
        } else {
          this.enableKeyboardAccessibility(workspace);
        }
        return true;
      },
    };

    Blockly.ShortcutRegistry.registry.register(toggleKeyboardNavShortcut);
    const ctrlShiftK = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.K, [Blockly.utils.KeyCodes.CTRL,
          Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        ctrlShiftK, toggleKeyboardNavShortcut.name);
  }

  /**
   * Keyboard shortcut to go to the out location when in keyboard navigation
   * mode.
   */
  registerOut() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const outShortcut = {
      name: Constants.ShortcutNames.OUT,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace, e, action) => {
        const toolbox = workspace.getToolbox();
        switch (this.workspaceStates[workspace.id]) {
          case Constants.State.WORKSPACE:
            return workspace.getCursor().onBlocklyAction(action);
          case Constants.State.FLYOUT:
            this.focusToolbox_(workspace);
            return true;
          case Constants.State.TOOLBOX:
            return toolbox && typeof toolbox.onBlocklyAction == 'function' ?
                toolbox.onBlocklyAction(action) : false;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(outShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.A, outShortcut.name);
  }

  /**
   * Keyboard shortcut to go to the next location when in keyboard navigation
   * mode.
   */
  registerNext() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const nextShortcut = {
      name: Constants.ShortcutNames.NEXT,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace, e, action) => {
        const toolbox = workspace.getToolbox();
        const flyout = workspace.getFlyout();
        switch (this.workspaceStates[workspace.id]) {
          case Constants.State.WORKSPACE:
            return workspace.getCursor().onBlocklyAction(action);
          case Constants.State.FLYOUT:
            return !!(flyout && flyout.onBlocklyAction(action));
          case Constants.State.TOOLBOX:
            return toolbox && typeof toolbox.onBlocklyAction == 'function' ?
                toolbox.onBlocklyAction(action) : false;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(nextShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.S, nextShortcut.name);
  }

  /**
   * Keyboard shortcut to go to the in location when in keyboard navigation
   * mode.
   */
  registerIn() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const inShortcut = {
      name: Constants.ShortcutNames.IN,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace, e, action) => {
        const toolbox = workspace.getToolbox();
        let isHandled = false;
        switch (this.workspaceStates[workspace.id]) {
          case Constants.State.WORKSPACE:
            return workspace.getCursor().onBlocklyAction(action);
          case Constants.State.TOOLBOX:
            isHandled = toolbox &&
              typeof toolbox.onBlocklyAction == 'function' ?
                toolbox.onBlocklyAction(action) : false;
            if (!isHandled) {
              this.focusFlyout_(workspace);
            }
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(inShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.D, inShortcut.name);
  }

  /**
   * Keyboard shortcut to connect a block to a marked location when in keyboard
   * navigation mode.
   */
  registerInsert() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const insertShortcut = {
      name: Constants.ShortcutNames.INSERT,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        switch (this.workspaceStates[workspace.id]) {
          case Constants.State.WORKSPACE:
            return this.modify_(workspace);
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(insertShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.I, insertShortcut.name);
  }

  /** Keyboard shortcut to mark a location when in keyboard navigation mode. */
  registerMark() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const markShortcut = {
      name: Constants.ShortcutNames.MARK,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        switch (this.workspaceStates[workspace.id]) {
          case Constants.State.WORKSPACE:
            this.handleEnterForWS_(workspace);
            return true;
          case Constants.State.FLYOUT:
            this.insertFromFlyout(workspace);
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(markShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.ENTER, markShortcut.name);
  }

  /**
   * Keyboard shortcut to disconnect two blocks when in keyboard navigation
   * mode.
   */
  registerDisconnect() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const disconnectShortcut = {
      name: Constants.ShortcutNames.DISCONNECT,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        switch (this.workspaceStates[workspace.id]) {
          case Constants.State.WORKSPACE:
            this.disconnectBlocks_(workspace);
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(disconnectShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.X, disconnectShortcut.name);
  }

  /**
   * Keyboard shortcut to focus on the toolbox when in keyboard navigation
   * mode.
   */
  registerToolboxFocus() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const focusToolboxShortcut = {
      name: Constants.ShortcutNames.TOOLBOX,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        switch (this.workspaceStates[workspace.id]) {
          case Constants.State.WORKSPACE:
            if (!workspace.getToolbox()) {
              this.focusFlyout_(workspace);
            } else {
              this.focusToolbox_(workspace);
            }
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(focusToolboxShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.T, focusToolboxShortcut.name);
  }

  /**
   * Keyboard shortcut to exit the current location and focus on the workspace
   * when in keyboard navigation mode.
   */
  registerExit() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const exitShortcut = {
      name: Constants.ShortcutNames.EXIT,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode;
      },
      callback: (workspace) => {
        switch (this.workspaceStates[workspace.id]) {
          case Constants.State.FLYOUT:
            this.focusWorkspace_(workspace);
            return true;
          case Constants.State.TOOLBOX:
            this.focusWorkspace_(workspace);
            return true;
          default:
            return false;
        }
      },
    };

    Blockly.ShortcutRegistry.registry.register(exitShortcut, true);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.ESC, exitShortcut.name, true);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.E, exitShortcut.name, true);
  }

  /**
   * Keyboard shortcut to move the cursor on the workspace to the left when in
   * keyboard navigation mode.
   */
  registerWorkspaceMoveLeft() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const wsMoveLeftShortcut = {
      name: Constants.ShortcutNames.MOVE_WS_CURSOR_LEFT,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        return this.moveWSCursor_(workspace, -1, 0);
      },
    };

    Blockly.ShortcutRegistry.registry.register(wsMoveLeftShortcut);
    const shiftA = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.A, [Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        shiftA, wsMoveLeftShortcut.name);
  }

  /**
   * Keyboard shortcut to move the cursor on the workspace to the right when in
   * keyboard navigation mode.
   */
  registerWorkspaceMoveRight() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const wsMoveRightShortcut = {
      name: Constants.ShortcutNames.MOVE_WS_CURSOR_RIGHT,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        return this.moveWSCursor_(workspace, 1, 0);
      },
    };

    Blockly.ShortcutRegistry.registry.register(wsMoveRightShortcut);
    const shiftD = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.D, [Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        shiftD, wsMoveRightShortcut.name);
  }

  /**
   * Keyboard shortcut to move the cursor on the workspace up when in keyboard
   * navigation mode.
   */
  registerWorkspaceMoveUp() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const wsMoveUpShortcut = {
      name: Constants.ShortcutNames.MOVE_WS_CURSOR_UP,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        return this.moveWSCursor_(workspace, 0, -1);
      },
    };

    Blockly.ShortcutRegistry.registry.register(wsMoveUpShortcut);
    const shiftW = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.W, [Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        shiftW, wsMoveUpShortcut.name);
  }

  /**
   * Keyboard shortcut to move the cursor on the workspace down when in
   * keyboard navigation mode.
   */
  registerWorkspaceMoveDown() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const wsMoveDownShortcut = {
      name: Constants.ShortcutNames.MOVE_WS_CURSOR_DOWN,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly;
      },
      callback: (workspace) => {
        return this.moveWSCursor_(workspace, 0, 1);
      },
    };

    Blockly.ShortcutRegistry.registry.register(wsMoveDownShortcut);
    const shiftW = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.S, [Blockly.utils.KeyCodes.SHIFT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        shiftW, wsMoveDownShortcut.name);
  }

  /**
   * Keyboard shortcut to copy the block the cursor is currently on.
   * TODO: Add a method to test this.
   */
  registerCopy() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const copyShortcut = {
      name: Constants.ShortcutNames.COPY,
      preconditionFn: function(workspace) {
        if (workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly) {
          const curNode = workspace.getCursor().getCurNode();
          if (curNode && curNode.getSourceBlock()) {
            const sourceBlock = curNode.getSourceBlock();
            return !Blockly.Gesture.inProgress() &&
                sourceBlock &&
                sourceBlock.isDeletable() &&
                sourceBlock.isMovable();
          }
        }
        return false;
      },
      callback: (workspace) => {
        const sourceBlock = workspace.getCursor().getCurNode().getSourceBlock();
        Blockly.hideChaff();
        Blockly.copy(sourceBlock);
      },
    };

    Blockly.ShortcutRegistry.registry.register(copyShortcut);

    const ctrlC = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.C, [Blockly.utils.KeyCodes.CTRL]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(ctrlC, copyShortcut.name, true);

    const altC = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.C, [Blockly.utils.KeyCodes.ALT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(altC, copyShortcut.name, true);

    const metaC = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.C, [Blockly.utils.KeyCodes.META]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(metaC, copyShortcut.name, true);
  }

  /**
   * Register shortcut to paste the copied block to the marked location.
   */
  registerPaste() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const pasteShortcut = {
      name: Constants.ShortcutNames.PASTE,
      preconditionFn: function(workspace) {
        return workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly &&
            !Blockly.Gesture.inProgress();
      },
      callback: () => {
        return this.paste_();
      },
    };

    Blockly.ShortcutRegistry.registry.register(pasteShortcut);

    const ctrlV = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.V, [Blockly.utils.KeyCodes.CTRL]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(ctrlV, pasteShortcut.name, true);

    const altV = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.V, [Blockly.utils.KeyCodes.ALT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(altV, pasteShortcut.name, true);

    const metaV = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.V, [Blockly.utils.KeyCodes.META]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(metaV, pasteShortcut.name, true);
  }

  /**
   * Keyboard shortcut to copy and delete the block the cursor is on using on
   * ctrl+x, cmd+x, or alt+x.
   */
  registerCut() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const cutShortcut = {
      name: Constants.ShortcutNames.CUT,
      preconditionFn: function(workspace) {
        if (workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly) {
          const curNode = workspace.getCursor().getCurNode();
          if (curNode && curNode.getSourceBlock()) {
            const sourceBlock = curNode.getSourceBlock();
            return !Blockly.Gesture.inProgress() &&
                sourceBlock &&
                sourceBlock.isDeletable() &&
                sourceBlock.isMovable() &&
                !sourceBlock.workspace.isFlyout;
          }
        }
        return false;
      },
      callback: function(workspace) {
        const sourceBlock = workspace.getCursor().getCurNode().getSourceBlock();
        Blockly.copy(sourceBlock);
        Blockly.deleteBlock(sourceBlock);
        return true;
      },
    };

    Blockly.ShortcutRegistry.registry.register(cutShortcut);

    const ctrlX = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.X, [Blockly.utils.KeyCodes.CTRL]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(ctrlX, cutShortcut.name, true);

    const altX = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.X, [Blockly.utils.KeyCodes.ALT]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(altX, cutShortcut.name, true);

    const metaX = Blockly.ShortcutRegistry.registry.createSerializedKey(
        Blockly.utils.KeyCodes.X, [Blockly.utils.KeyCodes.META]);
    Blockly.ShortcutRegistry.registry.addKeyMapping(metaX, cutShortcut.name, true);
  }

  /**
   * Registers shortcut to delete the block the cursor is on using delete or
   * backspace.
   */
  registerDelete() {
    /** @type {!Blockly.ShortcutRegistry.KeyboardShortcut} */
    const deleteShortcut = {
      name: Constants.ShortcutNames.DELETE,
      preconditionFn: function(workspace) {
        if (workspace.keyboardAccessibilityMode &&
            !workspace.options.readOnly) {
          const curNode = workspace.getCursor().getCurNode();
          // TODO: What do we do if a block is selected but the cursor is on the ws?
          if (curNode && curNode.getSourceBlock()) {
            const sourceBlock = curNode.getSourceBlock();
            return sourceBlock &&
                sourceBlock.isDeletable();
          }
        }
        return false;
      },
      callback: (workspace, e) => {
        const sourceBlock = workspace.getCursor().getCurNode().getSourceBlock();
        // Delete or backspace.
        // Stop the browser from going back to the previous page.
        // Do this first to prevent an error in the delete code from resulting
        // in data loss.
        e.preventDefault();
        // Don't delete while dragging.  Jeez.
        if (Blockly.Gesture.inProgress()) {
          return false;
        }
        this.moveCursorOnBlockDelete(workspace, sourceBlock);
        Blockly.deleteBlock(sourceBlock);
        return true;
      },
    };
    Blockly.ShortcutRegistry.registry.register(deleteShortcut);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.DELETE, deleteShortcut.name, true);
    Blockly.ShortcutRegistry.registry.addKeyMapping(
        Blockly.utils.KeyCodes.BACKSPACE, deleteShortcut.name, true);
  }

  /**
   * Before a block is deleted move the cursor to the appropriate position.
   * @param {!Blockly.BlockSvg} deletedBlock The block that is being deleted.
   * TODO: CLean this up.
   */
  moveCursorOnBlockDelete(workspace, deletedBlock) {
    if (!workspace) {
      return;
    }
    const cursor = workspace.getCursor();
    if (cursor) {
      const curNode = cursor.getCurNode();
      const block = curNode ? curNode.getSourceBlock() : null;

      if (block === deletedBlock) {
        // If the block has a parent move the cursor to their connection point.
        if (block.getParent()) {
          var topConnection = block.previousConnection || block.outputConnection;
          if (topConnection) {
            cursor.setCurNode(
                Blockly.ASTNode.createConnectionNode(topConnection.targetConnection));
          }
        } else {
          // If the block is by itself move the cursor to the workspace.
          cursor.setCurNode(Blockly.ASTNode.createWorkspaceNode(block.workspace,
              block.getRelativeToSurfaceXY()));
        }
      // If the cursor is on a block whose parent is being deleted, move the
      // cursor to the workspace.
      } else if (block && deletedBlock.getChildren(false).indexOf(block) > -1) {
        cursor.setCurNode(Blockly.ASTNode.createWorkspaceNode(block.workspace,
            block.getRelativeToSurfaceXY()));
      }
    }
  };


  /**
   * Pastes the coped block to the marked location.
   * @return {boolean} True if the paste was sucessful, false otherwise.
   * @protected
   */
  paste_() {
    if (!Blockly.clipboardXml_) {
      return false;
    }
    let isHandled = false;
    // Pasting always pastes to the main workspace, even if the copy
    // started in a flyout workspace.
    let workspace = Blockly.clipboardSource_;
    if (workspace.isFlyout) {
      workspace = workspace.targetWorkspace;
    }
    if (Blockly.clipboardTypeCounts_ &&
        workspace.isCapacityAvailable(Blockly.clipboardTypeCounts_)) {
      Blockly.Events.setGroup(true);

      // Handle paste for keyboard navigation
      const markedNode = workspace.getMarker(Constants.MarkerName).getCurNode();
      if (workspace.keyboardAccessibilityMode &&
          markedNode && markedNode.isConnection()) {
        const block = Blockly.Xml.domToBlock(Blockly.clipboardXml_, workspace);
        // TODO: might need to disableEvents.
        const markedLocation =
          /** @type {!Blockly.RenderedConnection} */ (markedNode.getLocation());
        isHandled = this.insertBlock(/** @type {!Blockly.BlockSvg} */ (block),
            markedLocation);
        if (isHandled) {
          if (Blockly.Events.isEnabled() && !block.isShadow()) {
            Blockly.Events.fire(new Blockly.Events.BlockCreate(block));
          }
        }
      }
      Blockly.Events.setGroup(false);
    }
    return isHandled;
  }

  /**
   * Registers all default keyboard shortcut items for keyboard navigation. This
   * should be called once per instance of KeyboardShortcutRegistry.
   * @protected
   */
  registerDefaults_() {
    this.registerPrevious();
    this.registerNext();
    this.registerIn();
    this.registerOut();

    this.registerDisconnect();
    this.registerExit();
    this.registerInsert();
    this.registerMark();
    this.registerToolboxFocus();
    this.registerToggleKeyboardNav();

    this.registerWorkspaceMoveDown();
    this.registerWorkspaceMoveLeft();
    this.registerWorkspaceMoveUp();
    this.registerWorkspaceMoveRight();

    // TODO: Check all of these. with tests. lots of tests.
    this.registerCopy();
    this.registerPaste();
    this.registerCut();
    this.registerDelete();
  }
}

export const defaultNavigation = new Navigation();
