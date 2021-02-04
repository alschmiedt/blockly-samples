/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Holds all methods necessary to use Blockly through the
 * keyboard.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import * as Blockly from 'blockly/core';
import * as Constants from './constants';
import {cleregistrationName as cursorRegistrationName, registrationType as cursorRegistrationType} from './flyout_cursor';

/**
 * Class that holds all methods necessary for keyboard navigation to work.
 */
export class Navigation {
  /**
   * Constructor for keyboard navigation.
   */
  constructor() {
    /**
     * Object holding the location of the cursor for each workspace.
     * Possible locations of the cursor are: workspace, flyout or toolbox.
     * @type {Object<string,Constants.STATE>}
     * @protected
     */
    this.workspaceStates = {};

    /**
     * An optional method that allows a developer to customize how to handle
     * logs, warnings, and errors. The first argument is one of 'log', 'warn',
     * or 'error'. The second argument is the message.
     * @type {?function(Constants.LOGGING_MSG_TYPE, string)}
     * @public
     */
    this.loggingCallback = null;

    /**
     * The distance to move the cursor when the cursor is on the workspace.
     * @type {number}
     * @public
     */
    this.WS_MOVE_DISTANCE = 40;

    /**
     * The name of the marker to use for keyboard navigation.
     * @type {string}
     * @public
     */
    this.MARKER_NAME = 'local_marker_1';

    /**
     * The default coordinate to use when focusing on the workspace and no
     * blocks are present. In pixel coordinates, but will be converted to
     * workspace coordinates when used to position the cursor.
     * @type {!Blockly.utils.Coordinate}
     * @public
     */
    this.DEFAULT_WS_COORDINATE = new Blockly.utils.Coordinate(100, 100);

    /**
     * The default coordinate to use when moving the cursor to the workspace
     * after a block has been deleted. In pixel coordinates, but will be
     * converted to workspace coordinates when used to position the cursor.
     * @type {!Blockly.utils.Coordinate}
     * @public
     */
    this.WS_COORDINATE_ON_DELETE = new Blockly.utils.Coordinate(100, 100);

    /**
     * Wrapper for method that deals with workspace changes.
     * Used for removing change listener.
     * @type {Function}
     * @protected
     */
    this.wsChangeWrapper = this.workspaceChangeListener.bind(this);

    /**
     * Wrapper for method that deals with flyout changes.
     * Used for removing change listener.
     * @type {Function}
     * @protected
     */
    this.flyoutChangeWrapper = this.flyoutChangeListener.bind(this);

    /**
     * The list of registered workspaces.
     * Used when removing change listeners in dispose.
     * @type {!Array<!Blockly.WorkspaceSvg>}
     * @protected
     */
    this.workspaces = [];
  }

  /**
   * Adds all necessary change listeners and markers to a workspace for keyboard
   * navigation to work. This must be called for keyboard navigation to work
   * on a workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to add keyboard
   *     navigation to.
   * @public
   */
  addWorkspace(workspace) {
    this.workspaces.push(workspace);
    const flyout = workspace.getFlyout();
    workspace.getMarkerManager().registerMarker(
        this.MARKER_NAME, new Blockly.Marker());
    workspace.addChangeListener(this.wsChangeWrapper);

    if (flyout) {
      this.addFlyout(flyout);
    }
  }

  /**
   * Removes all keyboard navigation change listeners and markers.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to remove keyboard
   *     navigation from.
   * @public
   */
  removeWorkspace(workspace) {
    const workspaceIdx = this.workspaces.indexOf(workspace);
    const flyout = workspace.getFlyout();

    if (workspace.getCursor()) {
      this.disableKeyboardAccessibility(workspace);
    }

    if (workspaceIdx > -1) {
      this.workspaces.splice(workspaceIdx, 1);
    }
    if (workspace.getMarkerManager()) {
      workspace.getMarkerManager().unregisterMarker(this.MARKER_NAME);
    }
    workspace.removeChangeListener(this.wsChangeWrapper);

    if (flyout) {
      this.removeFlyout(flyout);
    }
  }

  /**
   * Sets the state for the given workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to set the state on.
   * @param {!Constants.STATE} state The navigation state.
   * @protected
   */
  setState(workspace, state) {
    this.workspaceStates[workspace.id] = state;
  }

  /**
   * Gets the navigation state of the current workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to get the state of.
   * @return {!Constants.STATE} The state of the given workspace.
   * @package
   */
  getState(workspace) {
    return this.workspaceStates[workspace.id];
  }

  /**
   * Gets the marker created for keyboard navigation.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to get the marker
   *     from.
   * @return {?Blockly.Marker} The marker created for keyboard navigation.
   * @protected
   */
  getMarker(workspace) {
    return workspace.getMarker(this.MARKER_NAME);
  }

  /**
   * Adds all event listeners and cursors to the flyout that are needed for
   * keyboard navigation to work.
   * @param {!Blockly.IFlyout} flyout The flyout to add a cursor and change
   *     listeners to.
   * @protected
   */
  addFlyout(flyout) {
    const flyoutWorkspace = flyout.getWorkspace();
    flyoutWorkspace.addChangeListener(this.flyoutChangeWrapper);
    const FlyoutCursorClass = Blockly.registry.getClass(
        cursorRegistrationType, cursorRegistrationName);
    flyoutWorkspace.getMarkerManager().setCursor(new FlyoutCursorClass());
  }

  /**
   * Removes all change listeners from the flyout that are needed for
   * keyboard navigation to work.
   * @param {!Blockly.IFlyout} flyout The flyout to add a cursor and event
   *     listeners to.
   * @protected
   */
  removeFlyout(flyout) {
    const flyoutWorkspace = flyout.getWorkspace();
    flyoutWorkspace.removeChangeListener(this.flyoutChangeWrapper);
  }

  /**
   * Updates the state of keyboard navigation and the position of the cursor
   * based on workspace events.
   * @param {!Blockly.Events.Abstract} e The Blockly event to process.
   * @protected
   */
  workspaceChangeListener(e) {
    const workspace = Blockly.Workspace.getById(e.workspaceId);
    if (!workspace || !workspace.keyboardAccessibilityMode) {
      return;
    }
    switch (e.type) {
      case Blockly.Events.DELETE:
        this.handleBlockDeleteByDrag(workspace, e);
        break;
      case Blockly.Events.BLOCK_CHANGE:
        if (e.element === 'mutation') {
          this.handleBlockMutation(
              workspace, /** @type {Blockly.Events.BlockChange} */ (e));
        }
        break;
      case Blockly.Events.CLICK:
        this.handleWorkspaceClick(
            workspace, /** @type {Blockly.Events.Click} */ (e));
        break;
      case Blockly.Events.TOOLBOX_ITEM_SELECT:
        this.handleToolboxCategoryClick(
            workspace, /** @type {Blockly.Events.ToolboxItemSelect} */ (e));
        break;
      case Blockly.Events.BLOCK_CREATE:
        this.handleBlockCreate(workspace, e);
    }
  }

  /**
   * Updates the state of keyboard navigation and the position of the cursor
   * based on events emitted from the flyout's workspace.
   * @param {!Blockly.Events.Abstract} e The Blockly event to process.
   * @protected
   */
  flyoutChangeListener(e) {
    const flyoutWorkspace = Blockly.Workspace.getById(e.workspaceId);
    const mainWorkspace = flyoutWorkspace.targetWorkspace;
    const flyout = mainWorkspace.getFlyout();

    // This is called for simple toolboxes and for toolboxes that have a flyout
    // that does not close. Autoclosing flyouts close before we need to focus
    // the cursor on the block that was clicked.
    if (mainWorkspace && mainWorkspace.keyboardAccessibilityMode &&
        !flyout.autoClose) {
      if ((e.type === Blockly.Events.CLICK && e.targetType === 'block')) {
        const block = flyoutWorkspace.getBlockById(e.blockId);
        this.handleBlockClickInFlyout(mainWorkspace, block);
      } else if (e.type === Blockly.Events.SELECTED) {
        const block = flyoutWorkspace.getBlockById(e.newElementId);
        this.handleBlockClickInFlyout(mainWorkspace, block);
      }
    }
  }

  /**
   * Moves the cursor to the workspace if a block has been dragged from a simple
   * toolbox. For a category toolbox this is handled in
   * handleToolboxCategoryClick_.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the cursor belongs
   *     to.
   * @param {!Blockly.Events.Abstract} e The Blockly event to process.
   * @protected
   */
  handleBlockCreate(workspace, e) {
    if (this.getState(workspace) === Constants.STATE.FLYOUT) {
      this.resetFlyout(workspace, !!workspace.getToolbox());
      this.setState(workspace, Constants.STATE.WORKSPACE);
    }
  }

  /**
   * Moves the cursor to the block level when the block the cursor is on
   * mutates.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the cursor belongs
   *     to.
   * @param {!Blockly.Events.BlockChange} e The Blockly event to process.
   * @protected
   */
  handleBlockMutation(workspace, e) {
    const mutatedBlockId = e.blockId;
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
   * Moves the cursor to the workspace when a user clicks on the workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the cursor belongs
   *     to.
   * @param {!Blockly.Events.Click} e The Blockly event to process.
   * @protected
   */
  handleWorkspaceClick(workspace, e) {
    const workspaceState = this.getState(workspace);
    if (workspaceState !== Constants.STATE.WORKSPACE) {
      this.resetFlyout(workspace, !!workspace.getToolbox());
      this.setState(workspace, Constants.STATE.WORKSPACE);
    }
  }

  /**
   * Moves the cursor to the toolbox when a user clicks on a toolbox category.
   * Moves the cursor to the workspace if theh user closes the toolbox category.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the toolbox is on.
   * @param {!Blockly.Events.ToolboxItemSelect} e The event emitted from the
   *     workspace.
   * @protected
   */
  handleToolboxCategoryClick(workspace, e) {
    const workspaceState = this.getState(workspace);
    if (e.newItem && workspaceState !== Constants.STATE.TOOLBOX) {
      // If the toolbox category was just clicked, focus on the toolbox.
      this.focusToolbox(workspace);
    } else if (!e.newItem) {
      // If the toolbox was closed, focus on the workspace.
      this.resetFlyout(workspace, !!workspace.getToolbox());
      this.setState(workspace, Constants.STATE.WORKSPACE);
    }
  }

  /**
   * Moves the cursor to the workspace when its parent block is deleted by
   * being dragged to the flyout or to the trashcan.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the block was on.
   * @param {!Blockly.Events.Delete} e The event emitted when a block is
   *     deleted.
   * @protected
   */
  handleBlockDeleteByDrag(workspace, e) {
    const deletedBlockId = e.blockId;
    const ids = e.ids;
    const cursor = workspace.getCursor();

    // Make sure the cursor is on a block.
    if (!cursor || !cursor.getCurNode() ||
        !cursor.getCurNode().getSourceBlock()) {
      return;
    }

    const curNode = cursor.getCurNode();
    const sourceBlock = curNode.getSourceBlock();
    if (sourceBlock.id === deletedBlockId || ids.indexOf(sourceBlock.id) > -1) {
      cursor.setCurNode(Blockly.ASTNode.createWorkspaceNode(
          workspace, this.WS_COORDINATE_ON_DELETE));
    }
  }

  /**
   * Handles when a user clicks on a block in the flyout by moving the cursor
   * to that stack of blocks and setting the state of navigation to the flyout.
   * @param {!Blockly.WorkspaceSvg} mainWorkspace The workspace the user clicked
   *     on.
   * @param {?Blockly.BlockSvg} block The block the user clicked on.
   * @protected
   */
  handleBlockClickInFlyout(mainWorkspace, block) {
    if (!block) {
      return;
    }
    if (block.isShadow()) {
      block = /** @type {Blockly.BlockSvg}*/ (block.getParent());
    }
    this.getFlyoutCursor(mainWorkspace)
        .setCurNode(Blockly.ASTNode.createStackNode(block));
    this.setState(mainWorkspace, Constants.STATE.FLYOUT);
  }

  /**
   * Moves the cursor to the appropriate location before a block is deleted.
   * This is used when the user deletes a block using the delete or backspace
   * key.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the block is being
   *     deleted on.
   * @param {!Blockly.BlockSvg} deletedBlock The block that is being deleted.
   * @package
   */
  moveCursorOnBlockDelete(workspace, deletedBlock) {
    if (!workspace || !workspace.getCursor()) {
      return;
    }
    const cursor = workspace.getCursor();
    const curNode = cursor.getCurNode();
    const block = curNode ? curNode.getSourceBlock() : null;

    if (block === deletedBlock) {
      // If the block has a parent move the cursor to their connection point.
      if (block.getParent()) {
        const topConnection =
            block.previousConnection || block.outputConnection;
        if (topConnection) {
          cursor.setCurNode(Blockly.ASTNode.createConnectionNode(
              topConnection.targetConnection));
        }
      } else {
        // If the block is by itself move the cursor to the workspace.
        cursor.setCurNode(Blockly.ASTNode.createWorkspaceNode(
            block.workspace, block.getRelativeToSurfaceXY()));
      }
      // If the cursor is on a block whose parent is being deleted, move the
      // cursor to the workspace.
    } else if (block && deletedBlock.getChildren(false).indexOf(block) > -1) {
      cursor.setCurNode(Blockly.ASTNode.createWorkspaceNode(
          block.workspace, block.getRelativeToSurfaceXY()));
    }
  }

  /**
   * Sets the navigation state to toolbox and selects the first category in the
   * toolbox. No-op if a toolbox does not exist on the given workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to get the toolbox
   *     on.
   * @package
   */
  focusToolbox(workspace) {
    const toolbox = workspace.getToolbox();
    if (!toolbox) {
      return;
    }

    this.setState(workspace, Constants.STATE.TOOLBOX);
    this.resetFlyout(workspace, false /* shouldHide */);

    if (!this.getMarker(workspace).getCurNode()) {
      this.markAtCursor(workspace);
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
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the flyout is on.
   * @package
   */
  focusFlyout(workspace) {
    const flyout = workspace.getFlyout();

    this.setState(workspace, Constants.STATE.FLYOUT);

    if (!this.getMarker(workspace).getCurNode()) {
      this.markAtCursor(workspace);
    }

    if (flyout && flyout.getWorkspace()) {
      const topBlocks = flyout.getWorkspace().getTopBlocks(true);
      if (topBlocks.length > 0) {
        const astNode = Blockly.ASTNode.createStackNode(topBlocks[0]);
        this.getFlyoutCursor(workspace).setCurNode(astNode);
      }
    }
  }

  /**
   * Sets the navigation state to workspace and moves the cursor to either the
   * top block on a workspace or to the workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to focus on.
   * @package
   */
  focusWorkspace(workspace) {
    Blockly.hideChaff();
    const reset = !!workspace.getToolbox();

    this.resetFlyout(workspace, reset);
    this.setState(workspace, Constants.STATE.WORKSPACE);
    this.setCursorOnWorkspaceFocus(workspace);
  }

  /**
   * Gets the cursor on the flyout's workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The main workspace the flyout is
   *     on.
   * @return {?Blockly.FlyoutCursor} The flyout's cursor or null if no flyout
   *     exists.
   * @protected
   */
  getFlyoutCursor(workspace) {
    const flyout = workspace.getFlyout();
    const cursor = flyout ? flyout.getWorkspace().getCursor() : null;

    return /** @type {Blockly.FlyoutCursor} */ (cursor);
  }

  /**
   * Hides the flyout cursor and optionally hides the flyout.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @param {boolean} shouldHide True if the flyout should be hidden.
   * @protected
   */
  resetFlyout(workspace, shouldHide) {
    if (this.getFlyoutCursor(workspace)) {
      this.getFlyoutCursor(workspace).hide();
      if (shouldHide) {
        workspace.getFlyout().hide();
      }
    }
  }

  /**
   * Tries to connect the given marker and cursor node.
   * @param {!Blockly.WorkspaceSvg} workspace The main workspace.
   * @param {!Blockly.ASTNode} markerNode The node to try to connect to.
   * @param {!Blockly.ASTNode} cursorNode The node to connect to the markerNode.
   * @return {boolean} True if the key was handled; false if something went
   *     wrong.
   * @protected
   */
  modify(workspace, markerNode, cursorNode) {
    if (!this.modifyWarn(markerNode, cursorNode)) {
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
      return this.connect(cursorConnection, markerConnection);
    } else if (
        markerNode.isConnection() &&
        (cursorType == Blockly.ASTNode.types.BLOCK ||
         cursorType == Blockly.ASTNode.types.STACK)) {
      const cursorBlock = /** @type {!Blockly.BlockSvg} */ (cursorLoc);
      const markerConnection =
          /** @type {!Blockly.RenderedConnection} */ (markerLoc);
      return this.insertBlock(cursorBlock, markerConnection);
    } else if (markerType == Blockly.ASTNode.types.WORKSPACE) {
      const block = cursorNode ? cursorNode.getSourceBlock() : null;
      return this.moveBlockToWorkspace(
          /** @type {Blockly.BlockSvg} */ (block), markerNode);
    }
    this.warn('Unexpected state in setWorkspaceState.');
    return false;
  }

  /**
   * Warns the user if the given cursor or marker node can not be connected.
   * @param {!Blockly.ASTNode} markerNode The node to try to connect to.
   * @param {!Blockly.ASTNode} cursorNode The node to connect to the markerNode.
   * @return {boolean} True if the marker and cursor are valid types, false
   *     otherwise.
   * @protected
   */
  modifyWarn(markerNode, cursorNode) {
    if (!markerNode) {
      this.warn('Cannot insert with no marked node.');
      return false;
    }

    if (!cursorNode) {
      this.warn('Cannot insert with no cursor node.');
      return false;
    }
    const markerType = markerNode.getType();
    const cursorType = cursorNode.getType();

    // Check the marker for invalid types.
    if (markerType == Blockly.ASTNode.types.FIELD) {
      this.warn('Should not have been able to mark a field.');
      return false;
    } else if (markerType == Blockly.ASTNode.types.BLOCK) {
      this.warn('Should not have been able to mark a block.');
      return false;
    } else if (markerType == Blockly.ASTNode.types.STACK) {
      this.warn('Should not have been able to mark a stack.');
      return false;
    }

    // Check the cursor for invalid types.
    if (cursorType == Blockly.ASTNode.types.FIELD) {
      this.warn('Cannot attach a field to anything else.');
      return false;
    } else if (cursorType == Blockly.ASTNode.types.WORKSPACE) {
      this.warn('Cannot attach a workspace to anything else.');
      return false;
    }
    return true;
  }

  /**
   * Disconnect the block from its parent and move to the position of the
   * workspace node.
   * @param {?Blockly.BlockSvg} block The block to be moved to the workspace.
   * @param {!Blockly.ASTNode} wsNode The workspace node holding the position
   *     the block will be moved to.
   * @return {boolean} True if the block can be moved to the workspace,
   *     false otherwise.
   * @protected
   */
  moveBlockToWorkspace(block, wsNode) {
    if (!block) {
      return false;
    }
    if (block.isShadow()) {
      this.warn('Cannot move a shadow block to the workspace.');
      return false;
    }
    if (block.getParent()) {
      block.unplug(false);
    }
    block.moveTo(wsNode.getWsCoordinate());
    return true;
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
  disconnectChild(movingConnection, destConnection) {
    const movingBlock = movingConnection.getSourceBlock();
    const destBlock = destConnection.getSourceBlock();

    if (movingBlock.getRootBlock() === destBlock.getRootBlock()) {
      if (movingBlock.getDescendants(false).indexOf(destBlock) > -1) {
        this.getInferiorConnection(destConnection).disconnect();
      } else {
        this.getInferiorConnection(movingConnection).disconnect();
      }
    }
  }

  /**
   * Tries to connect the  given connections.
   *
   * If the given connections are not compatible try finding compatible
   * connections on the source blocks of the given connections.
   *
   * @param {?Blockly.RenderedConnection} movingConnection The connection that
   *     is being moved.
   * @param {?Blockly.RenderedConnection} destConnection The connection to be
   *     moved to.
   * @return {boolean} True if the two connections or their target connections
   *     were connected, false otherwise.
   * @protected
   */
  connect(movingConnection, destConnection) {
    if (!movingConnection || !destConnection) {
      return false;
    }

    const movingInferior = this.getInferiorConnection(movingConnection);
    const destSuperior = this.getSuperiorConnection(destConnection);

    const movingSuperior = this.getSuperiorConnection(movingConnection);
    const destInferior = this.getInferiorConnection(destConnection);

    if (movingInferior && destSuperior &&
        this.moveAndConnect(movingInferior, destSuperior)) {
      return true;
      // Try swapping the inferior and superior connections on the blocks.
    } else if (
        movingSuperior && destInferior &&
        this.moveAndConnect(movingSuperior, destInferior)) {
      return true;
    } else if (this.moveAndConnect(movingConnection, destConnection)) {
      return true;
    } else {
      const checker = movingConnection.getConnectionChecker();
      const reason =
          checker.canConnectWithReason(movingConnection, destConnection, false);
      this.warn(
          'Connection failed with error: ' +
          checker.getErrorMessage(reason, movingConnection, destConnection));
      return false;
    }
  }

  /**
   * If the given connection is superior find the inferior connection on the
   * source block.
   * @param {?Blockly.RenderedConnection} connection The connection trying to be
   *     connected.
   * @return {?Blockly.RenderedConnection} The inferior connection or null if
   *     none exists.
   * @protected
   */
  getInferiorConnection(connection) {
    const block = /** @type{!Blockly.BlockSvg} */ (connection.getSourceBlock());
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
   * @param {?Blockly.RenderedConnection} connection The connection trying to be
   *     connected.
   * @return {?Blockly.RenderedConnection} The superior connection or null if
   *     none exists.
   * @protected
   */
  getSuperiorConnection(connection) {
    if (connection.isSuperior()) {
      return connection;
    } else if (connection.targetConnection) {
      return connection.targetConnection;
    }
    return null;
  }

  /**
   * Moves the moving connection to the target connection and connects them.
   * @param {?Blockly.RenderedConnection} movingConnection The connection that
   *     is being moved.
   * @param {?Blockly.RenderedConnection} destConnection The connection to be
   *     moved to.
   * @return {boolean} True if the connections were connected, false otherwise.
   * @protected
   */
  moveAndConnect(movingConnection, destConnection) {
    if (!movingConnection || !destConnection) {
      return false;
    }
    const movingBlock = movingConnection.getSourceBlock();
    const checker = movingConnection.getConnectionChecker();

    if (checker.canConnect(movingConnection, destConnection, false) &&
        !destConnection.getSourceBlock().isShadow()) {
      this.disconnectChild(movingConnection, destConnection);

      // Position the root block near the connection so it does not move the
      // other block when they are connected.
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
   * Tries to connect the given block to the destination connection, making an
   * intelligent guess about which connection to use to on the moving block.
   * @param {!Blockly.BlockSvg} block The block to move.
   * @param {!Blockly.RenderedConnection} destConnection The connection to
   *     connect to.
   * @return {boolean} Whether the connection was successful.
   * @protected
   */
  insertBlock(block, destConnection) {
    switch (destConnection.type) {
      case Blockly.PREVIOUS_STATEMENT:
        if (this.connect(block.nextConnection, destConnection)) {
          return true;
        }
        break;
      case Blockly.NEXT_STATEMENT:
        if (this.connect(block.previousConnection, destConnection)) {
          return true;
        }
        break;
      case Blockly.INPUT_VALUE:
        if (this.connect(block.outputConnection, destConnection)) {
          return true;
        }
        break;
      case Blockly.OUTPUT_VALUE:
        for (let i = 0; i < block.inputList.length; i++) {
          const inputConnection = /** @type {Blockly.RenderedConnection} */ (
              block.inputList[i].connection);
          if (inputConnection && inputConnection.type === Blockly.INPUT_VALUE &&
              this.connect(inputConnection, destConnection)) {
            return true;
          }
        }
        // If there are no input values pass the output and destination
        // connections to connect_ to find a way to connect the two.
        if (block.outputConnection &&
            this.connect(block.outputConnection, destConnection)) {
          return true;
        }
        break;
    }
    this.warn('This block can not be inserted at the marked location.');
    return false;
  }

  /**
   * Disconnects the connection that the cursor is pointing to, and bump blocks.
   * This is a no-op if the connection cannot be broken or if the cursor is not
   * pointing to a connection.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @package
   */
  disconnectBlocks(workspace) {
    const curNode = workspace.getCursor().getCurNode();
    if (!curNode.isConnection()) {
      this.log(
          'Cannot disconnect blocks when the cursor is not on a connection');
      return;
    }
    const curConnection =
        /** @type {!Blockly.RenderedConnection} */ (curNode.getLocation());
    if (!curConnection.isConnected()) {
      this.log('Cannot disconnect unconnected connection');
      return;
    }
    const superiorConnection = curConnection.isSuperior() ?
        curConnection :
        curConnection.targetConnection;

    const inferiorConnection = curConnection.isSuperior() ?
        curConnection.targetConnection :
        curConnection;

    if (inferiorConnection.getSourceBlock().isShadow()) {
      this.log('Cannot disconnect a shadow block');
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
  markAtCursor(workspace) {
    this.getMarker(workspace).setCurNode(workspace.getCursor().getCurNode());
  }

  /**
   * Removes the marker from its current location and hide it.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @protected
   */
  removeMark(workspace) {
    const marker = this.getMarker(workspace);
    marker.setCurNode(null);
    marker.hide();
  }
}
