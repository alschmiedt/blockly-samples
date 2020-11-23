/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Holds all methods and state necessary for keyboard navigation
 * to work.
 * @author aschmiedt@google.com (Abby Schmiedt)
 */

import * as Blockly from 'blockly/core';
import * as Constants from './constants';
import {registrationName, registrationType} from './flyout_cursor';

/**
 * Class that holds all methods necessary for keyboard navigation to work.
 */
export class Navigation {
  /**
   * Constructor for navigation.
   */
  constructor() {
    /**
     * Object holding the current location of the workspace's cursor.
     * (Ex: flyout, toolbox, workspace).
     * @type {Object<string,Constants.State>}
     * @package
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

    /**
     * The distance to move the cursor when it is on the workspace.
     * @type {number}
     * @public
     * TODO: Should this be public?
     */
    this.WS_MOVE_DISTANCE = 40;

    /**
     * The name of the marker to use for keyboard navigation.
     * @type {string}
     * @public
     * TODO: Should this be public?
     * TODO: Should this be static?
     * TODO: Should someone be allowed to change this?
     */
    this.MARKER_NAME = 'local_marker_1';

    /**
     * The default coordinate to use when focusing on the workspace.
     * TODO: Rename this.
     * @type {!Blockly.utils.Coordinate}
     * @public
     */
    this.START_COORDINATE = new Blockly.utils.Coordinate(100, 100);

    /**
     * The default coordinate to use when moving the cursor to the workspace
     * after a block has been deleted.
     * @type {!Blockly.utils.Coordinate}
     * @public
     */
    this.WS_COORDINATE_ON_DELETE = new Blockly.utils.Coordinate(100, 100);
  }

  /**
   * Adds all necessary event listeners and markers to a workspace for keyboard
   * navigation to work. This must be called for keyboard navigation to work
   * on a workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to add keyboard
   *     navigation to.
   * @package
   */
  addWorkspace(workspace) {
    const flyout = workspace.getFlyout();
    workspace.getMarkerManager().registerMarker(this.MARKER_NAME,
        new Blockly.Marker());

    workspace.addChangeListener((e) => this.workspaceChangeListener_(e));

    if (flyout) {
      const flyoutWorkspace = flyout.getWorkspace();
      flyoutWorkspace.addChangeListener(
          (e) => this.flyoutChangeListener_(e));
      // TODO: Fix registrationType --> CursorRegistrationType
      const FlyoutCursorClass = Blockly.registry.getClass(
          registrationType, registrationName);
      flyoutWorkspace.getMarkerManager().setCursor(new FlyoutCursorClass());
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
    const workspaceState = this.getState(workspace);
    if (!workspace || !workspace.keyboardAccessibilityMode) {
      return;
    }
    switch (e.type) {
      case Blockly.Events.DELETE:
        this.handleBlockDeleteByDrag_(e, workspace);
        break;
      case Blockly.Events.BLOCK_CHANGE:
        if (e.element === 'mutation') {
          this.handleBlockMutation_(workspace, e.blockId);
        }
        break;
      case Blockly.Events.CLICK:
        this.handleWorkspaceClick_(workspace, workspaceState);
        break;
      case Blockly.Events.TOOLBOX_ITEM_SELECT:
        this.handleToolboxCategoryClick_(e, workspace, workspaceState);
        break;
    }
  }

  /**
   * Moves the cursor to the block level when the block the cursor is on is
   * mutated.
   * @param {Blockly.WorkspaceSvg} workspace The workspace the cursor is on.
   * @param {string} mutatedBlockId The id of the block being mutated.
   * @protected
   */
  handleBlockMutation_(workspace, mutatedBlockId) {
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
   * Focuses on the workspace when a user clicks on the workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the user clicked on.
   * @param {string} workspaceState The state of the workspace.
   * @protected
   */
  handleWorkspaceClick_(workspace, workspaceState) {
    // If there is a workspace click and we are in the toolbox or flyout,
    // focus on the workspace.
    if (workspaceState !== Constants.State.WORKSPACE) {
      this.resetFlyout_(workspace, !!workspace.getToolbox());
      this.setState(workspace, Constants.State.WORKSPACE);
    }
  }

  /**
   * Focuses on the toolbox when a user clicks on a toolbox category. Focuses
   * on the workspace if the user closes a toolbox category.
   * @param {!Blockly.Events} e The event emitted from the workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the toolbox is on.
   * @param {string} workspaceState The state of the workspace.
   * @protected
   */
  handleToolboxCategoryClick_(e, workspace, workspaceState) {
    if (e.newItem && workspaceState !== Constants.State.TOOLBOX) {
      // If the toolbox category was just clicked, focus on the toolbox.
      this.focusToolbox(workspace);
    } else if (!e.newItem) {
      // If the toolbox was closed, focus on the workspace.
      this.resetFlyout_(workspace, !!workspace.getToolbox());
      this.setState(workspace, Constants.State.WORKSPACE);
    }
  }

  /**
   * Moves the cursor to the workspace when the block it was on has been deleted
   * by being dragged to the traschan or flyout.
   * @param {!Blockly.Events} e The event emitted when a block is deleted.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the block was
   *     deleted on.
   * @protected
   */
  handleBlockDeleteByDrag_(e, workspace) {
    const deletedBlockId = e.blockId;
    const ids = e.ids;
    const cursor = workspace.getCursor();

    // Make sure the cursor is on a block.
    if (!cursor || !cursor.getCurNode() || !cursor.getCurNode().getSourceBlock()) {
      return;
    }

    const curNode = cursor.getCurNode();
    const sourceBlock = curNode.getSourceBlock();
    if (sourceBlock.id === deletedBlockId || ids.indexOf(sourceBlock.id) > -1) {
      cursor.setCurNode(Blockly.ASTNode.createWorkspaceNode(workspace,
          this.WS_COORDINATE_ON_DELETE));
    }
  }

  /**
   * Moves the cursor to the appropriate location before a block is deleted.
   * This is used when the user deletes a block using the delete or backsapce
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
        const topConnection = block.previousConnection || block.outputConnection;
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
      workspace.getMarker(this.MARKER_NAME).draw();
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

    if (mainWorkspace && mainWorkspace.keyboardAccessibilityMode &&
        !flyout.autoClose) {
      if ((e.type === Blockly.Events.CLICK && e.targetType === 'block')) {
        const block = flyoutWorkspace.getBlockById(e.blockId);
        this.handleBlockClickInFlyout_(mainWorkspace, block);
      } else if (e.type === Blockly.Events.SELECTED) {
        const block = flyoutWorkspace.getBlockById(e.newElementId);
        this.handleBlockClickInFlyout_(mainWorkspace, block);
      }
    }
  }

  /**
   * Handles when a user clicks on a block in the flyout by moving the cursor
   * to the block and setting the state of navigation to flyout.
   * @param {Blockly.WorkspaceSvg} mainWorkspace The main workspace.
   * @param {Blockly.BlockSvg} block The block the user clicked on.
   * @protected
   */
  handleBlockClickInFlyout_(mainWorkspace, block) {
    if (!block) {
      return;
    }
    if (block.isShadow()) {
      block = block.getParent();
    }
    this.getFlyoutCursor_(mainWorkspace).setCurNode(
        Blockly.ASTNode.createStackNode(block));
    this.setState(mainWorkspace, Constants.State.FLYOUT);
  }

  /**
   * Sets the state for the given workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to set the state on.
   * @param {string} state The navigation state.
   * @public
   */
  setState(workspace, state) {
    this.workspaceStates[workspace.id] = state;
  }

  /**
   * Gets the navigation state of the current workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to get the state of.
   * @return {Constants.State} The sate of the given workspace.
   */
  getState(workspace) {
    return this.workspaceStates[workspace.id];
  }

  /**
   * Gets the marker created for keyboard navigation.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to get the marker
   *     from.
   * @return {Blockly.Marker} The marker created for keyboard navigation.
   * @protected
   */
  getMarker_(workspace) {
    return workspace.getMarker(this.MARKER_NAME);
  }

  /**
   * Sets the navigation state to toolbox and selects the first category in the
   * toolbox. No-op if a toolbox does not exist on the given workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to get the toolbox
   *     on.
   * TODO: Should this be split up into multiple functions? Same for other focus methods?
   * @package
   */
  focusToolbox(workspace) {
    // TODO: Need to add checks here or level above for if the workspace is null.
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
   * @param {!Blockly.WorkspaceSvg} workspace The workspace the flyout is on.
   * @package
   */
  focusFlyout(workspace) {
    const flyout = workspace.getFlyout();

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
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to focus on.
   * @package
   */
  focusWorkspace(workspace) {
    Blockly.hideChaff();
    const reset = !!workspace.getToolbox();

    this.resetFlyout_(workspace, reset);
    this.setState(workspace, Constants.State.WORKSPACE);
    this.setCursorOnWorkspaceFocus_(workspace);
  }

  /**
   * Sets the cursor to the top connection point on a block or to the workspace
   * if there are no blocks on the workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The main Blockly workspace.
   * @protected
   */
  setCursorOnWorkspaceFocus_(workspace) {
    const topBlocks = workspace.getTopBlocks(true);
    const cursor = workspace.getCursor();

    if (topBlocks.length > 0) {
      cursor.setCurNode(Blockly.ASTNode.createTopNode(topBlocks[0]));
    } else {
      const wsNode = Blockly.ASTNode.createWorkspaceNode(
          workspace, this.START_COORDINATE);
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
   * @package
   */
  insertFromFlyout(workspace) {
    const newBlock = this.createNewBlock_(workspace);
    // Sets the cursor to the new block, so we can use modify to connect the
    // new block with the marked connection.
    workspace.getCursor().setCurNode(
        Blockly.ASTNode.createBlockNode(newBlock));
    if (!this.modify(workspace)) {
      this.warn_(
          'Something went wrong while inserting a block from the flyout.');
    }

    this.focusWorkspace(workspace);
    workspace.getCursor().setCurNode(Blockly.ASTNode.createTopNode(newBlock));
    this.removeMark_(workspace);
  }

  /**
   * Creates a new block based on the current block the flyout cursor is on.
   * @param {!Blockly.WorkspaceSvg} workspace The main workspace. The workspace
   *     the block will be placed on.
   * @return {!Blockly.BlockSvg} The newly created block.
   * @protected
   */
  createNewBlock_(workspace) {
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
    return newBlock;
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
   * Tries to connect the current marker and cursor location. Warns the user if
   * the two locations can not be connected.
   * @param {!Blockly.WorkspaceSvg} workspace The main workspace.
   * @return {boolean} True if the key was handled; false if something went
   *     wrong.
   * @package
   */
  modify(workspace) {
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
      return this.insertBlock_(cursorBlock, markerConnection);
    } else if (markerType == Blockly.ASTNode.types.WORKSPACE) {
      const block = cursorNode ? cursorNode.getSourceBlock() : null;
      return this.moveBlockToWorkspace_(
          /** @type {Blockly.BlockSvg} */ (block), markerNode);
    }
    this.warn_('Unexpected state in modify.');
    return false;
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
   * If the given connection is superior find the inferior connection on the
   * source block.
   * @param {Blockly.RenderedConnection} connection The connection trying to be
   *     connected.
   * @return {Blockly.RenderedConnection} The inferior connection or null if
   *     none exists.
   * @protected
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
  insertBlock_(block, destConnection) {
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
    // TODO: Add a way to turn warnings off.
    this.warn_('This block can not be inserted at the marked location.');
    return false;
  }

  /**
   * Disconnect the connection that the cursor is pointing to, and bump blocks.
   * This is a no-op if the connection cannot be broken or if the cursor is not
   * pointing to a connection.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @package
   */
  disconnectBlocks(workspace) {
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
   * @protected
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
   * @package
   */
  enableKeyboardAccessibility(workspace) {
    if (!workspace.keyboardAccessibilityMode) {
      workspace.keyboardAccessibilityMode = true;
      this.focusWorkspace(workspace);
    }
  }

  /**
   * Disables accessibility mode.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to disable keyboard
   *     accessibility on.
   * @package
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
   * @protected
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
   * @protected
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
   * @protected
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
   * @package
   */
  moveWSCursor(workspace, xDirection, yDirection) {
    const cursor = workspace.getCursor();
    const curNode = workspace.getCursor().getCurNode();

    if (curNode.getType() !== Blockly.ASTNode.types.WORKSPACE) {
      return false;
    }

    const wsCoord = curNode.getWsCoordinate();
    const newX = xDirection * this.WS_MOVE_DISTANCE + wsCoord.x;
    const newY = yDirection * this.WS_MOVE_DISTANCE + wsCoord.y;

    cursor.setCurNode(Blockly.ASTNode.createWorkspaceNode(
        workspace, new Blockly.utils.Coordinate(newX, newY)));
    return true;
  }

  /**
   * Handles hitting the enter key on the workspace.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace.
   * @package
   */
  handleEnterForWS(workspace) {
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
   * Pastes the coped block to the marked location.
   * @return {boolean} True if the paste was sucessful, false otherwise.
   * TODO: This uses a lot of the paste in core. Is there any way around this?
   * @package
   */
  paste() {
    // TODO: This is private, need to make an issue to update
    if (!Blockly.clipboardXml_) {
      return false;
    }
    // Pasting always pastes to the main workspace, even if the copy
    // started in a flyout workspace.
    let workspace = Blockly.clipboardSource_;
    let isHandled = false;

    if (workspace.isFlyout) {
      workspace = workspace.targetWorkspace;
    }
    if (Blockly.clipboardTypeCounts_ &&
        workspace.isCapacityAvailable(Blockly.clipboardTypeCounts_)) {
      Blockly.Events.setGroup(true);
      const block = Blockly.Xml.domToBlock(Blockly.clipboardXml_, workspace);
      isHandled = this.paste_(workspace, block);
      if (isHandled) {
        if (Blockly.Events.isEnabled() && !block.isShadow()) {
          Blockly.Events.fire(new Blockly.Events.BlockCreate(block));
        }
      }

      // Handle paste for keyboard navigation
      Blockly.Events.setGroup(false);
    }
    return isHandled;
  }

  /**
   * Inserts a block where the current marker is.
   * @param {!Blockly.WorkspaceSvg} workspace The workspace to paste the block
   *     on.
   * @param {!Blockly.BlockSvg} block The block to paste.
   * @return {boolean} True if the block was pasted to the workspace, false
   *     otherwise.
   * @protected
   */
  paste_(workspace, block) {
    let isHandled = false;
    const markedNode = workspace.getMarker(this.MARKER_NAME).getCurNode();
    if (markedNode && markedNode.isConnection() || markedNode.getType() === Blockly.ASTNode.Types.WORKSPACE) {
      // TODO: might need to disableEvents.
      const markedLocation =
        /** @type {!Blockly.RenderedConnection} */ (markedNode.getLocation());
      isHandled = this.insertBlock_(/** @type {!Blockly.BlockSvg} */ (block),
          markedLocation);
    }
    return isHandled;
  }
}
