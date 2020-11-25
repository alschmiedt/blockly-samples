/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview
 * @author aschmiedt@google.com (Abby Schmiedt)
 */
'use strict';


const chai = require('chai');
const sinon = require('sinon');

const Blockly = require('blockly/node');
const {defaultRegister, Constants} = require('../src/index');

suite('Navigation', function() {
  function createNavigationWorkspace(enableKeyboardNav, readOnly) {
    const workspace = Blockly.inject('blocklyDiv', {toolbox: `
      <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox-categories" style="display: none">
        <category name="First" css-container="something">
          <block type="basic_block">
            <field name="TEXT">FirstCategory-FirstBlock</field>
          </block>
          <block type="basic_block">
            <field name="TEXT">FirstCategory-SecondBlock</field>
          </block>
        </category>
        <category name="Second">
          <block type="basic_block">
            <field name="TEXT">SecondCategory-FirstBlock</field>
          </block>
        </category>
      </xml>
  `,
    readOnly: readOnly,
    });
    if (enableKeyboardNav) {
      defaultRegister.navigation_.enableKeyboardAccessibility(workspace);
      defaultRegister.navigation_.setState(workspace, Constants.State.WORKSPACE);
    }
    return workspace;
  }

  /**
   * Creates a key down event used for testing.
   * @param {number} keyCode The keycode for the event. Use Blockly.utils.KeyCodes enum.
   * @param {string} type The type of the target. This only matters for the
   *     Blockly.utils.isTargetInput method.
   * @param {Array<number>} modifiers A list of modifiers. Use Blockly.utils.KeyCodes enum.
   * @return {{keyCode: *, getModifierState: (function(): boolean),
   *     preventDefault: preventDefault, target: {type: *}}} The mocked keydown event.
   */
  function createKeyDownEvent(keyCode, type, modifiers) {
    const event = {
      keyCode: keyCode,
      target: {type: type},
      getModifierState: function(name) {
        if (name == 'Shift' && this.shiftKey) {
          return true;
        } else if (name == 'Control' && this.ctrlKey) {
          return true;
        } else if (name == 'Meta' && this.metaKey) {
          return true;
        } else if (name == 'Alt' && this.altKey) {
          return true;
        }
        return false;
      },
      preventDefault: function() {},
    };
    if (modifiers && modifiers.length > 0) {
      event.altKey = modifiers.indexOf(Blockly.utils.KeyCodes.ALT) > -1;
      event.ctrlKey = modifiers.indexOf(Blockly.utils.KeyCodes.CTRL) > -1;
      event.metaKey = modifiers.indexOf(Blockly.utils.KeyCodes.META) > -1;
      event.shiftKey = modifiers.indexOf(Blockly.utils.KeyCodes.SHIFT) > -1;
    }
    return event;
  }

  setup(function() {
    this.jsdomCleanup =
      require('jsdom-global')('<!DOCTYPE html><div id="blocklyDiv"></div>');
    Blockly.utils.dom.getFastTextWidthWithSizeString = function() {
      return 10;
    };
    defaultRegister.init();
  });

  teardown(function() {
    this.jsdomCleanup();
    defaultRegister.dispose();
  });

  // Test that toolbox key handlers call through to the right functions and
  // transition correctly between toolbox, workspace, and flyout.
  suite('Tests toolbox keys', function() {
    setup(function() {
      Blockly.defineBlocksWithJsonArray([{
        'type': 'basic_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_input',
            'name': 'TEXT',
            'text': 'default',
          },
        ],
      }]);
      this.workspace = createNavigationWorkspace(true);
      defaultRegister.navigation_.addWorkspace(this.workspace);
      defaultRegister.navigation_.focusToolbox(this.workspace);
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
      delete Blockly.Blocks['basic_block'];
    });

    const testCases = [
      [
        'Calls toolbox selectNext_',
        createKeyDownEvent(Blockly.utils.KeyCodes.S, 'NotAField'), 'selectNext_',
      ],
      [
        'Calls toolbox selectPrevious_',
        createKeyDownEvent(Blockly.utils.KeyCodes.W, 'NotAField'),
        'selectPrevious_',
      ],
      [
        'Calls toolbox selectParent_',
        createKeyDownEvent(Blockly.utils.KeyCodes.D, 'NotAField'),
        'selectChild_',
      ],
      [
        'Calls toolbox selectChild_',
        createKeyDownEvent(Blockly.utils.KeyCodes.A, 'NotAField'),
        'selectParent_',
      ],
    ];

    testCases.forEach(function(testCase) {
      const testCaseName = testCase[0];
      const mockEvent = testCase[1];
      const stubName = testCase[2];
      test(testCaseName, function() {
        const toolbox = this.workspace.getToolbox();
        const selectStub = sinon.stub(toolbox, stubName);
        toolbox.selectedItem_ = toolbox.contents_[0];
        Blockly.onKeyDown(mockEvent);
        sinon.assert.called(selectStub);
      });
    });

    test('Go to flyout', function() {
      const navigation = defaultRegister.navigation_;
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.D, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          navigation.getState(this.workspace), Constants.State.FLYOUT);

      const flyoutCursor = navigation.getFlyoutCursor_(this.workspace);
      chai.assert.equal(flyoutCursor.getCurNode().getLocation().getFieldValue('TEXT'),
          'FirstCategory-FirstBlock');
    });

    test('Focuses workspace from toolbox (e)', function() {
      const navigation = defaultRegister.navigation_;
      navigation.setState(this.workspace, Constants.State.TOOLBOX);
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.E, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          navigation.getState(this.workspace), Constants.State.WORKSPACE);
    });
    test('Focuses workspace from toolbox (escape)', function() {
      const navigation = defaultRegister.navigation_;
      navigation.setState(this.workspace, Constants.State.TOOLBOX);
      const mockEvent =
          createKeyDownEvent(Blockly.utils.KeyCodes.ESC, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          navigation.getState(this.workspace), Constants.State.WORKSPACE);
    });
    // More tests:
    // - nested categories
  });

  // Test that flyout key handlers call through to the right functions and
  // transition correctly between toolbox, workspace, and flyout.
  suite('Tests flyout keys', function() {
    setup(function() {
      Blockly.defineBlocksWithJsonArray([{
        'type': 'basic_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_input',
            'name': 'TEXT',
            'text': 'default',
          },
        ],
      }]);
      this.workspace = createNavigationWorkspace(true);
      this.navigation = defaultRegister.navigation_;
      this.navigation.addWorkspace(this.workspace);
      this.navigation.focusToolbox(this.workspace);
      this.navigation.focusFlyout(this.workspace);
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
      delete Blockly.Blocks['basic_block'];
    });
    // Should be a no-op
    test('Previous at beginning', function() {
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.W, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.FLYOUT);
      chai.assert.equal(this.navigation.getFlyoutCursor_(this.workspace).getCurNode().getLocation().getFieldValue('TEXT'),
          'FirstCategory-FirstBlock');
    });
    test('Previous', function() {
      const flyoutBlocks = this.workspace.getFlyout().getWorkspace().getTopBlocks();
      this.navigation.getFlyoutCursor_(this.workspace).setCurNode(
          Blockly.ASTNode.createStackNode(flyoutBlocks[1]));
      let flyoutBlock = this.navigation.getFlyoutCursor_(this.workspace).getCurNode().getLocation();
      chai.assert.equal(flyoutBlock.getFieldValue('TEXT'),
          'FirstCategory-SecondBlock');

      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.W, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.FLYOUT);
      flyoutBlock = this.navigation.getFlyoutCursor_(this.workspace).getCurNode().getLocation();
      chai.assert.equal(flyoutBlock.getFieldValue('TEXT'),
          'FirstCategory-FirstBlock');
    });

    test('Next', function() {
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.S, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.FLYOUT);
      const flyoutBlock = this.navigation.getFlyoutCursor_(this.workspace).getCurNode().getLocation();
      chai.assert.equal(flyoutBlock.getFieldValue('TEXT'),
          'FirstCategory-SecondBlock');
    });

    test('Out', function() {
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.A, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.TOOLBOX);
    });

    test('Mark', function() {
      const mockEvent =
          createKeyDownEvent(Blockly.utils.KeyCodes.ENTER, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.WORKSPACE);
      chai.assert.equal(this.workspace.getTopBlocks().length, 1);
    });

    test('Exit', function() {
      const mockEvent =
          createKeyDownEvent(Blockly.utils.KeyCodes.ESC, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.WORKSPACE);
    });
  });
  // Test that workspace key handlers call through to the right functions and
  // transition correctly between toolbox, workspace, and flyout.
  suite('Tests workspace keys', function() {
    setup(function() {
      Blockly.defineBlocksWithJsonArray([{
        'type': 'basic_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_input',
            'name': 'TEXT',
            'text': 'default',
          },
        ],
        'previousStatement': null,
        'nextStatement': null,
      }]);
      this.workspace = createNavigationWorkspace(true);
      defaultRegister.addWorkspace(this.workspace);
      this.navigation = defaultRegister.navigation_;
      this.basicBlock = this.workspace.newBlock('basic_block');
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
      delete Blockly.Blocks['basic_block'];
    });

    test('Previous', function() {
      const prevSpy = sinon.spy(this.workspace.getCursor(), 'prev');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const wEvent = createKeyDownEvent(Blockly.utils.KeyCodes.W, '');

      Blockly.onKeyDown(wEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(prevSpy);
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Next', function() {
      const nextSpy = sinon.spy(this.workspace.getCursor(), 'next');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const sEvent = createKeyDownEvent(Blockly.utils.KeyCodes.S, '');

      Blockly.onKeyDown(sEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(nextSpy);
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Out', function() {
      const outSpy = sinon.spy(this.workspace.getCursor(), 'out');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const aEvent = createKeyDownEvent(Blockly.utils.KeyCodes.A, '');

      Blockly.onKeyDown(aEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(outSpy);
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('In', function() {
      const inSpy = sinon.spy(this.workspace.getCursor(), 'in');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const dEvent = createKeyDownEvent(Blockly.utils.KeyCodes.D, '');

      Blockly.onKeyDown(dEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(inSpy);
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Insert', function() {
      // Stub modify as we are not testing its behavior, only if it was called.
      // Otherwise, there is a warning because there is no marked node.
      const modifyStub = sinon.stub(this.navigation, 'modify').returns(true);
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const iEvent = createKeyDownEvent(Blockly.utils.KeyCodes.I, '');

      Blockly.onKeyDown(iEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(modifyStub);
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Mark', function() {
      this.workspace.getCursor().setCurNode(
          Blockly.ASTNode.createConnectionNode(this.basicBlock.previousConnection));
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const enterEvent = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER, '');

      Blockly.onKeyDown(enterEvent);

      const markedNode = this.workspace.getMarker(this.navigation.MARKER_NAME).getCurNode();
      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(markedNode.getLocation(), this.basicBlock.previousConnection);
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Toolbox', function() {
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const tEvent = createKeyDownEvent(Blockly.utils.KeyCodes.T, '');

      Blockly.onKeyDown(tEvent);

      const firstCategory = this.workspace.getToolbox().contents_[0];
      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.equal(
          this.workspace.getToolbox().getSelectedItem(), firstCategory);
      chai.assert.equal(
          this.navigation.getState(this.workspace), Constants.State.TOOLBOX);
    });
  });

  suite('Test key press', function() {
    setup(function() {
      Blockly.defineBlocksWithJsonArray([{
        'type': 'basic_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_dropdown',
            'name': 'OP',
            'options': [
              ['%{BKY_MATH_ADDITION_SYMBOL}', 'ADD'],
              ['%{BKY_MATH_SUBTRACTION_SYMBOL}', 'MINUS'],
              ['%{BKY_MATH_MULTIPLICATION_SYMBOL}', 'MULTIPLY'],
              ['%{BKY_MATH_DIVISION_SYMBOL}', 'DIVIDE'],
              ['%{BKY_MATH_POWER_SYMBOL}', 'POWER'],
            ],
          },
        ],
      }]);
      this.workspace = createNavigationWorkspace(true);
      defaultRegister.addWorkspace(this.workspace);
      this.navigation = defaultRegister.navigation_;

      this.workspace.getCursor().drawer_ = null;
      this.basicBlock = this.workspace.newBlock('basic_block');
    });
    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
      delete Blockly.Blocks['basic_block'];
    });


    test('Action does not exist', function() {
      const block = this.workspace.getTopBlocks()[0];
      const field = block.inputList[0].fieldRow[0];
      const fieldSpy = sinon.spy(field, 'onShortcut');
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.N, '');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      this.workspace.getCursor().setCurNode(Blockly.ASTNode.createFieldNode(field));

      Blockly.onKeyDown(mockEvent);

      chai.assert.isFalse(keyDownSpy.returned(true));
      sinon.assert.notCalled(fieldSpy);
    });

    test('Action exists - field handles action', function() {
      const block = this.workspace.getTopBlocks()[0];
      const field = block.inputList[0].fieldRow[0];
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.A, '');
      const fieldSpy = sinon.stub(field, 'onShortcut').returns(true);
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      this.workspace.getCursor().setCurNode(Blockly.ASTNode.createFieldNode(field));

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(fieldSpy);
    });

    test('Action exists - field does not handle action', function() {
      const block = this.workspace.getTopBlocks()[0];
      const field = block.inputList[0].fieldRow[0];
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.A, '');
      const fieldSpy = sinon.spy(field, 'onShortcut');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      this.workspace.getCursor().setCurNode(Blockly.ASTNode.createFieldNode(field));

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(fieldSpy);
    });

    test('Toggle Action Off', function() {
      const mockEvent = createKeyDownEvent(
          Blockly.utils.KeyCodes.K, '',
          [Blockly.utils.KeyCodes.SHIFT, Blockly.utils.KeyCodes.CTRL]);
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      this.workspace.keyboardAccessibilityMode = true;

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.isFalse(this.workspace.keyboardAccessibilityMode);
    });

    test('Toggle Action On', function() {
      const mockEvent = createKeyDownEvent(
          Blockly.utils.KeyCodes.K, '',
          [Blockly.utils.KeyCodes.SHIFT, Blockly.utils.KeyCodes.CTRL]);
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      this.workspace.keyboardAccessibilityMode = false;

      Blockly.onKeyDown(mockEvent);

      chai.assert.isTrue(keyDownSpy.returned(true));
      chai.assert.isTrue(this.workspace.keyboardAccessibilityMode);
    });

    suite('Test key press in read only mode', function() {
      setup(function() {
        Blockly.defineBlocksWithJsonArray([{
          'type': 'field_block',
          'message0': '%1 %2',
          'args0': [
            {
              'type': 'field_dropdown',
              'name': 'NAME',
              'options': [
                [
                  'a',
                  'optionA',
                ],
              ],
            },
            {
              'type': 'input_value',
              'name': 'NAME',
            },
          ],
          'previousStatement': null,
          'nextStatement': null,
          'colour': 230,
          'tooltip': '',
          'helpUrl': '',
        }]);
        this.workspace = createNavigationWorkspace(true, true);

        Blockly.mainWorkspace = this.workspace;
        this.workspace.getCursor().drawer_ = null;

        this.fieldBlock1 = this.workspace.newBlock('field_block');
      });

      teardown(function() {
        this.workspace.dispose();
        sinon.restore();
        delete Blockly.Blocks['field_block'];
      });

      test('Perform valid action for read only', function() {
        const astNode = Blockly.ASTNode.createBlockNode(this.fieldBlock1);
        const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.S, '');
        this.workspace.getCursor().setCurNode(astNode);
        const keyDownSpy =
            sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

        Blockly.onKeyDown(mockEvent);

        chai.assert.isTrue(keyDownSpy.returned(true));
      });

      test('Perform invalid action for read only', function() {
        const astNode = Blockly.ASTNode.createBlockNode(this.fieldBlock1);
        const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.I, '');
        this.workspace.getCursor().setCurNode(astNode);
        const keyDownSpy =
            sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

        Blockly.onKeyDown(mockEvent);

        chai.assert.isTrue(keyDownSpy.returned(false));
      });

      test('Try to perform action on a field', function() {
        const field = this.fieldBlock1.inputList[0].fieldRow[0];
        const astNode = Blockly.ASTNode.createFieldNode(field);
        const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER, '');
        this.workspace.getCursor().setCurNode(astNode);
        const keyDownSpy =
            sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

        Blockly.onKeyDown(mockEvent);

        chai.assert.isTrue(keyDownSpy.returned(false));
      });
    });
  });
  suite('Insert Functions', function() {
    setup(function() {
      Blockly.defineBlocksWithJsonArray([{
        'type': 'basic_block',
        'message0': '%1',
        'args0': [
          {
            'type': 'field_input',
            'name': 'TEXT',
            'text': 'default',
          },
        ],
        'previousStatement': null,
        'nextStatement': null,
      }]);

      this.workspace = createNavigationWorkspace(true);
      defaultRegister.addWorkspace(this.workspace);
      this.navigation = defaultRegister.navigation_;

      const basicBlock = this.workspace.newBlock('basic_block');
      const basicBlock2 = this.workspace.newBlock('basic_block');

      this.basicBlock = basicBlock;
      this.basicBlock2 = basicBlock2;
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
      delete Blockly.Blocks['basic_block'];
    });

    test('Insert from flyout with a valid connection marked', function() {
      const previousConnection = this.basicBlock.previousConnection;
      const prevNode = Blockly.ASTNode.createConnectionNode(previousConnection);
      this.workspace.getMarker(this.navigation.MARKER_NAME).setCurNode(prevNode);

      this.navigation.focusToolbox(this.workspace);
      this.navigation.focusFlyout(this.workspace);
      this.navigation.insertFromFlyout(this.workspace);

      const insertedBlock = this.basicBlock.previousConnection.targetBlock();

      chai.assert.isTrue(insertedBlock !== null);
      chai.assert.equal(this.navigation.getState(this.workspace),
          Constants.State.WORKSPACE);
    });

    test('Insert Block from flyout without marking a connection', function() {
      this.navigation.focusToolbox(this.workspace);
      this.navigation.focusFlyout(this.workspace);
      this.navigation.insertFromFlyout(this.workspace);

      const numBlocks = this.workspace.getTopBlocks().length;

      // Make sure the block was not connected to anything
      chai.assert.isNull(this.basicBlock.previousConnection.targetConnection);
      chai.assert.isNull(this.basicBlock.nextConnection.targetConnection);

      // Make sure that the block was added to the workspace
      chai.assert.equal(numBlocks, 3);
      chai.assert.equal(this.navigation.getState(this.workspace),
          Constants.State.WORKSPACE);
    });

    test('Connect two blocks that are on the workspace', function() {
      const targetNode = Blockly.ASTNode.createConnectionNode(this.basicBlock.previousConnection);
      const sourceNode = Blockly.ASTNode.createConnectionNode(this.basicBlock2.nextConnection);

      this.navigation.modify(this.workspace, targetNode, sourceNode);
      const insertedBlock = this.basicBlock.previousConnection.targetBlock();

      chai.assert.isNotNull(insertedBlock);
    });
  });
  suite('Connect Blocks', function() {
    setup(function() {
      Blockly.defineBlocksWithJsonArray([{
        'type': 'basic_block',
        'message0': '',
        'previousStatement': null,
        'nextStatement': null,
      },
      {
        'type': 'inline_block',
        'message0': '%1 %2',
        'args0': [
          {
            'type': 'input_value',
            'name': 'NAME',
          },
          {
            'type': 'input_value',
            'name': 'NAME',
          },
        ],
        'inputsInline': true,
        'output': null,
        'tooltip': '',
        'helpUrl': '',
      }]);

      this.workspace = createNavigationWorkspace(true);
      defaultRegister.addWorkspace(this.workspace);
      this.navigation = defaultRegister.navigation_;

      const basicBlock = this.workspace.newBlock('basic_block');
      const basicBlock2 = this.workspace.newBlock('basic_block');
      const basicBlock3 = this.workspace.newBlock('basic_block');
      const basicBlock4 = this.workspace.newBlock('basic_block');

      const inlineBlock1 = this.workspace.newBlock('inline_block');
      const inlineBlock2 = this.workspace.newBlock('inline_block');


      this.basicBlock = basicBlock;
      this.basicBlock2 = basicBlock2;
      this.basicBlock3 = basicBlock3;
      this.basicBlock4 = basicBlock4;

      this.inlineBlock1 = inlineBlock1;
      this.inlineBlock2 = inlineBlock2;

      this.basicBlock.nextConnection.connect(this.basicBlock2.previousConnection);

      this.basicBlock3.nextConnection.connect(this.basicBlock4.previousConnection);

      this.inlineBlock1.inputList[0].connection.connect(this.inlineBlock2.outputConnection);
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
      delete Blockly.Blocks['basic_block'];
      delete Blockly.Blocks['inline_block'];
    });

    test('Connect cursor on previous into stack', function() {
      const markedLocation = this.basicBlock2.previousConnection;
      const cursorLocation = this.basicBlock3.previousConnection;

      this.navigation.connect_(cursorLocation, markedLocation);

      chai.assert.equal(this.basicBlock.nextConnection.targetBlock(), this.basicBlock3);
      chai.assert.equal(this.basicBlock2.previousConnection.targetBlock(), this.basicBlock4);
    });

    test('Connect marker on previous into stack', function() {
      const markedLocation = this.basicBlock3.previousConnection;
      const cursorLocation = this.basicBlock2.previousConnection;

      this.navigation.connect_(cursorLocation, markedLocation);

      chai.assert.equal(this.basicBlock.nextConnection.targetBlock(), this.basicBlock3);
      chai.assert.equal(this.basicBlock2.previousConnection.targetBlock(), this.basicBlock4);

    });

    test('Connect cursor on next into stack', function() {
      const markedLocation = this.basicBlock2.previousConnection;
      const cursorLocation = this.basicBlock4.nextConnection;

      this.navigation.connect_(cursorLocation, markedLocation);

      chai.assert.equal(this.basicBlock.nextConnection.targetBlock(), this.basicBlock4);
      chai.assert.isNull(this.basicBlock3.nextConnection.targetConnection);
    });

    test('Connect cursor with parents', function() {
      const markedLocation = this.basicBlock3.previousConnection;
      const cursorLocation = this.basicBlock2.nextConnection;

      this.navigation.connect_(cursorLocation, markedLocation);

      chai.assert.equal(this.basicBlock3.previousConnection.targetBlock(), this.basicBlock2);
    });

    test('Try to connect input that is descendant of output', function() {
      const markedLocation = this.inlineBlock2.inputList[0].connection;
      const cursorLocation = this.inlineBlock1.outputConnection;

      this.navigation.connect_(cursorLocation, markedLocation);

      chai.assert.isNull(this.inlineBlock2.outputConnection.targetBlock());
      chai.assert.equal(this.inlineBlock1.outputConnection.targetBlock(), this.inlineBlock2);
    });
  });

  suite('Test cursor move on block delete', function() {
    setup(function() {
      Blockly.defineBlocksWithJsonArray([{
        'type': 'basic_block',
        'message0': '',
        'previousStatement': null,
        'nextStatement': null,
      }]);
      this.workspace = createNavigationWorkspace(true);
      defaultRegister.addWorkspace(this.workspace);
      this.navigation = defaultRegister.navigation_;

      this.basicBlockA = this.workspace.newBlock('basic_block');
      this.basicBlockB = this.workspace.newBlock('basic_block');
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
      delete Blockly.Blocks['basic_block'];
    });

    test('Delete block - has parent ', function() {
      this.basicBlockA.nextConnection.connect(this.basicBlockB.previousConnection);
      const astNode = Blockly.ASTNode.createBlockNode(this.basicBlockB);
      // Set the cursor to be on the child block
      this.workspace.getCursor().setCurNode(astNode);
      // Remove the child block
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.DELETE, '');
      Blockly.onKeyDown(mockEvent);
      chai.assert.equal(this.workspace.getCursor().getCurNode().getType(),
          Blockly.ASTNode.types.NEXT);
    });

    test('Delete block - no parent ', function() {
      const astNode = Blockly.ASTNode.createBlockNode(this.basicBlockB);
      this.workspace.getCursor().setCurNode(astNode);

      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.DELETE, '');
      Blockly.onKeyDown(mockEvent);

      chai.assert.equal(this.workspace.getCursor().getCurNode().getType(),
          Blockly.ASTNode.types.WORKSPACE);
    });

    test('Delete parent block', function() {
      this.basicBlockA.nextConnection.connect(this.basicBlockB.previousConnection);
      const astNode = Blockly.ASTNode.createBlockNode(this.basicBlockB);
      const mockDeleteBlockEvent = {
        'blockId': this.basicBlockA,
        'ids': [
          this.basicBlockA.id,
          this.basicBlockB.id,
        ],
      };
      // Set the cursor to be on the child block
      this.workspace.getCursor().setCurNode(astNode);
      // Remove the parent block
      this.navigation.handleBlockDeleteByDrag_(mockDeleteBlockEvent, this.workspace);
      chai.assert.equal(this.workspace.getCursor().getCurNode().getType(),
          Blockly.ASTNode.types.WORKSPACE);
    });

    test('Delete top block in stack', function() {
      this.basicBlockA.nextConnection.connect(this.basicBlockB.previousConnection);
      const astNode = Blockly.ASTNode.createStackNode(this.basicBlockA);
      const mockDeleteBlockEvent = {
        'blockId': this.basicBlockA,
        'ids': [
          this.basicBlockA.id,
          this.basicBlockB.id,
        ],
      };
      // Set the cursor to be on the stack
      this.workspace.getCursor().setCurNode(astNode);
      // Remove the top block in the stack
      this.navigation.handleBlockDeleteByDrag_(mockDeleteBlockEvent, this.workspace);
      chai.assert.equal(this.workspace.getCursor().getCurNode().getType(),
          Blockly.ASTNode.types.WORKSPACE);
    });
  });
});
