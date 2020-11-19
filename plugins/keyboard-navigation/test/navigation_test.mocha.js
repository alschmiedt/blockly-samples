/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const chai = require('chai');
const Blockly = require('blockly/node');

require('../src/index');
const assert = chai.assert;
const sinon = require('sinon');
const {toolboxCategories} = require('@blockly/dev-tools');
const {defaultRegistration} = require('../src/index');
const Constants = require('../src/constants');


suite('Navigation', function() {
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

  function createNavigationWorkspace(enableKeyboardNav, readOnly) {
    const workspace =
        Blockly.inject('blocklyDiv', {toolbox: toolboxCategories, readOnly: readOnly});
    // if (enableKeyboardNav) {
    //   defaultRegistration.navigation.enableKeyboardAccessibility();
    //   defaultRegistration.navigation.currentState_ = Constants.State.WORKSPACE;
    // }
    return workspace;
  }

  setup(function() {
    this.jsdomCleanup =
        require('jsdom-global')('<!DOCTYPE html><div id="blocklyDiv"></div>');
  });
  teardown(function() {
    this.jsdomCleanup();
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
      defaultRegistration.addWorkspace(this.workspace);
      defaultRegistration.navigation.focusToolbox(this.workspace);
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
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.D, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          defaultRegistration.navigation.currentState_, Constants.State.FLYOUT);

      const flyoutCursor = defaultRegistration.navigation.getFlyoutCursor_();
      assert.equal(flyoutCursor.getCurNode().getLocation().getFieldValue('TEXT'),
          'FirstCategory-FirstBlock');
    });

    test('Focuses workspace from toolbox (e)', function() {
      defaultRegistration.navigation.getState(Constants.State.TOOLBOX);
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.E, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          defaultRegistration.navigation.currentState_, Constants.State.WORKSPACE);
    });
    test('Focuses workspace from toolbox (escape)', function() {
      defaultRegistration.navigation.getState(Constants.State.TOOLBOX);
      const mockEvent =
          createKeyDownEvent(Blockly.utils.KeyCodes.ESC, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          defaultRegistration.navigation.getState(this.workspace), Constants.State.WORKSPACE);
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
      defaultRegistration.navigation.focusToolbox(this.workspace);
      defaultRegistration.navigation.focusFlyout(this.workspace);
      this.flyoutCursor = defaultRegistration.navigation.getFlyoutCursor_();
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
    });

    // Should be a no-op
    test('Previous at beginning', function() {
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.W, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.FLYOUT);
      assert.equal(this.flyoutCursor.getCurNode().getLocation().getFieldValue('TEXT'),
          'FirstCategory-FirstBlock');
    });

    test('Previous', function() {
      const flyoutBlocks = this.workspace.getFlyout().getWorkspace().getTopBlocks();
      defaultRegistration.navigation.getFlyoutCursor_().setCurNode(
          Blockly.ASTNode.createStackNode(flyoutBlocks[1]));
      let flyoutBlock = this.flyoutCursor.getCurNode().getLocation();
      assert.equal(flyoutBlock.getFieldValue('TEXT'),
          'FirstCategory-SecondBlock');
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.W, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.FLYOUT);
      flyoutBlock = this.flyoutCursor.getCurNode().getLocation();
      assert.equal(flyoutBlock.getFieldValue('TEXT'),
          'FirstCategory-FirstBlock');
    });

    test('Next', function() {
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.S, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.FLYOUT);
      const flyoutBlock = this.flyoutCursor.getCurNode().getLocation();
      assert.equal(flyoutBlock.getFieldValue('TEXT'),
          'FirstCategory-SecondBlock');
    });

    test('Out', function() {
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.A, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.TOOLBOX);
    });

    test('Mark', function() {
      const mockEvent =
          createKeyDownEvent(Blockly.utils.KeyCodes.ENTER, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.WORKSPACE);
      assert.equal(this.workspace.getTopBlocks().length, 1);
    });

    test('Exit', function() {
      const mockEvent =
          createKeyDownEvent(Blockly.utils.KeyCodes.ESC, 'NotAField');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.WORKSPACE);
    });
  });

  // Test that workspace key handlers call through to the right functions and
  // transition correctly between toolbox, workspace, and flyout.
  suite('Tests workspace keys', function() {
    setup(function() {
      // Blockly.defineBlocksWithJsonArray([{
      //   'type': 'basic_block',
      //   'message0': '%1',
      //   'args0': [
      //     {
      //       'type': 'field_input',
      //       'name': 'TEXT',
      //       'text': 'default',
      //     },
      //   ],
      //   'previousStatement': null,
      //   'nextStatement': null,
      // }]);
      this.workspace = createNavigationWorkspace(true);
      this.basicBlock = this.workspace.newBlock('basic_block');
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
    });

    test('Previous', function() {
      const prevSpy = sinon.spy(this.workspace.getCursor(), 'prev');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const wEvent = createKeyDownEvent(Blockly.utils.KeyCodes.W, '');

      Blockly.onKeyDown(wEvent);

      assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(prevSpy);
      console.log("I AM HEREERERERER");
      console.log(defaultRegistration.getState(this.workspace));
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Next', function() {
      const nextSpy = sinon.spy(this.workspace.getCursor(), 'next');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const sEvent = createKeyDownEvent(Blockly.utils.KeyCodes.S, '');

      Blockly.onKeyDown(sEvent);

      assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(nextSpy);
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Out', function() {
      const outSpy = sinon.spy(this.workspace.getCursor(), 'out');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const aEvent = createKeyDownEvent(Blockly.utils.KeyCodes.A, '');

      Blockly.onKeyDown(aEvent);

      assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(outSpy);
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('In', function() {
      const inSpy = sinon.spy(this.workspace.getCursor(), 'in');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const dEvent = createKeyDownEvent(Blockly.utils.KeyCodes.D, '');

      Blockly.onKeyDown(dEvent);

      assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(inSpy);
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Insert', function() {
      // Stub modify as we are not testing its behavior, only if it was called.
      // Otherwise, there is a warning because there is no marked node.
      const modifyStub = sinon.stub(defaultRegistration.navigation, 'modify').returns(true);
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const iEvent = createKeyDownEvent(Blockly.utils.KeyCodes.I, '');

      Blockly.onKeyDown(iEvent);

      assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(modifyStub);
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Mark', function() {
      this.workspace.getCursor().setCurNode(
          Blockly.ASTNode.createConnectionNode(this.basicBlock.previousConnection));
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const enterEvent = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER, '');

      Blockly.onKeyDown(enterEvent);

      const markedNode = this.workspace.getMarker(defaultRegistration.navigation.MARKER_NAME).getCurNode();
      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(markedNode.getLocation(), this.basicBlock.previousConnection);
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.WORKSPACE);
    });

    test('Toolbox', function() {
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      const tEvent = createKeyDownEvent(Blockly.utils.KeyCodes.T, '');

      Blockly.onKeyDown(tEvent);

      const firstCategory = this.workspace.getToolbox().contents_[0];
      assert.isTrue(keyDownSpy.returned(true));
      assert.equal(
          this.workspace.getToolbox().getSelectedItem(), firstCategory);
      assert.equal(
          defaultRegistration.getState(this.workspace), Constants.State.TOOLBOX);
    });
  });

  suite('Test key press', function() {
    setup(function() {
      Blockly.defineBlocksWithJsonArray([{
        'type': 'dropdown_block',
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
      this.workspace.getCursor().drawer_ = null;
      this.basicBlock = this.workspace.newBlock('dropdown_block');
    });
    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
    });


    test('Action does not exist', function() {
      const block = this.workspace.getTopBlocks()[0];
      const field = block.inputList[0].fieldRow[0];
      const fieldSpy = sinon.spy(field, 'onBlocklyAction');
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.N, '');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      this.workspace.getCursor().setCurNode(Blockly.ASTNode.createFieldNode(field));

      Blockly.onKeyDown(mockEvent);

      assert.isFalse(keyDownSpy.returned(true));
      sinon.assert.notCalled(fieldSpy);
    });

    test('Action exists - field handles action', function() {
      const block = this.workspace.getTopBlocks()[0];
      const field = block.inputList[0].fieldRow[0];
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.A, '');
      const fieldSpy = sinon.stub(field, 'onBlocklyAction').returns(true);
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      this.workspace.getCursor().setCurNode(Blockly.ASTNode.createFieldNode(field));

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      sinon.assert.calledOnce(fieldSpy);

    });

    test('Action exists - field does not handle action', function() {
      const block = this.workspace.getTopBlocks()[0];
      const field = block.inputList[0].fieldRow[0];
      const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.A, '');
      const fieldSpy = sinon.spy(field, 'onBlocklyAction');
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      this.workspace.getCursor().setCurNode(Blockly.ASTNode.createFieldNode(field));

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
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

      assert.isTrue(keyDownSpy.returned(true));
      assert.isFalse(this.workspace.keyboardAccessibilityMode);
    });

    test('Toggle Action On', function() {
      const mockEvent = createKeyDownEvent(
          Blockly.utils.KeyCodes.K, '',
          [Blockly.utils.KeyCodes.SHIFT, Blockly.utils.KeyCodes.CTRL]);
      const keyDownSpy =
          sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');
      this.workspace.keyboardAccessibilityMode = false;

      Blockly.onKeyDown(mockEvent);

      assert.isTrue(keyDownSpy.returned(true));
      assert.isTrue(this.workspace.keyboardAccessibilityMode);
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
      });

      test('Perform valid action for read only', function() {
        const astNode = Blockly.ASTNode.createBlockNode(this.fieldBlock1);
        const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.S, '');
        this.workspace.getCursor().setCurNode(astNode);
        const keyDownSpy =
            sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

        Blockly.onKeyDown(mockEvent);

        assert.isTrue(keyDownSpy.returned(true));
      });

      test('Perform invalid action for read only', function() {
        const astNode = Blockly.ASTNode.createBlockNode(this.fieldBlock1);
        const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.I, '');
        this.workspace.getCursor().setCurNode(astNode);
        const keyDownSpy =
            sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

        Blockly.onKeyDown(mockEvent);

        assert.isTrue(keyDownSpy.returned(false));
      });

      test('Try to perform action on a field', function() {
        const field = this.fieldBlock1.inputList[0].fieldRow[0];
        const astNode = Blockly.ASTNode.createFieldNode(field);
        const mockEvent = createKeyDownEvent(Blockly.utils.KeyCodes.ENTER, '');
        this.workspace.getCursor().setCurNode(astNode);
        const keyDownSpy =
            sinon.spy(Blockly.ShortcutRegistry.registry, 'onKeyDown');

        Blockly.onKeyDown(mockEvent);

        assert.isTrue(keyDownSpy.returned(false));
      });
    });
  });

  suite('Insert Functions', function() {
    setup(function() {
      Blockly.defineBlocksWithJsonArray([{
        'type': 'text_input_block',
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

      const basicBlock = this.workspace.newBlock('text_input_block');
      const basicBlock2 = this.workspace.newBlock('text_input_block');

      this.basicBlock = basicBlock;
      this.basicBlock2 = basicBlock2;
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
    });

    test('Insert from flyout with a valid connection marked', function() {
      const previousConnection = this.basicBlock.previousConnection;
      const prevNode = Blockly.ASTNode.createConnectionNode(previousConnection);
      this.workspace.getMarker(defaultRegistration.navigation.MARKER_NAME).setCurNode(prevNode);

      defaultRegistration.navigation.focusToolbox(this.workspace);
      defaultRegistration.navigation.focusFlyout(this.workspace);
      defaultRegistration.navigation.insertFromFlyout(this.workspace);

      const insertedBlock = this.basicBlock.previousConnection.targetBlock();

      assert.isTrue(insertedBlock !== null);
      assert.equal(defaultRegistration.navigation.getState(this.workspace),
          Constants.State.WORKSPACE);
    });

    test('Insert Block from flyout without marking a connection', function() {
      defaultRegistration.navigation.focusToolbox(this.workspace);
      defaultRegistration.navigation.focusFlyout(this.workspace);
      defaultRegistration.navigation.insertFromFlyout(this.workspace);

      const numBlocks = this.workspace.getTopBlocks().length;

      // Make sure the block was not connected to anything
      assert.isNull(this.basicBlock.previousConnection.targetConnection);
      assert.isNull(this.basicBlock.nextConnection.targetConnection);

      // Make sure that the block was added to the workspace
      assert.equal(numBlocks, 3);
      assert.equal(defaultRegistration.navigation.getState(this.workspace),
          Constants.State.WORKSPACE);
    });

    test('Connect two blocks that are on the workspace', function() {
      const targetNode = Blockly.ASTNode.createConnectionNode(this.basicBlock.previousConnection);
      this.workspace.getMarker(defaultRegistration.navigation.MARKER_NAME).setCurNode(targetNode);

      const sourceNode = Blockly.ASTNode.createConnectionNode(this.basicBlock2.nextConnection);
      this.workspace.getCursor().setCurNode(sourceNode);

      defaultRegistration.navigation.modify();
      const insertedBlock = this.basicBlock.previousConnection.targetBlock();

      assert.isNotNull(insertedBlock);
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
    });

    test('Connect cursor on previous into stack', function() {
      const markedLocation = this.basicBlock2.previousConnection;
      const cursorLocation = this.basicBlock3.previousConnection;

      defaultRegistration.navigation.connect_(cursorLocation, markedLocation);

      assert.equal(this.basicBlock.nextConnection.targetBlock(), this.basicBlock3);
      assert.equal(this.basicBlock2.previousConnection.targetBlock(), this.basicBlock4);
    });

    test('Connect marker on previous into stack', function() {
      const markedLocation = this.basicBlock3.previousConnection;
      const cursorLocation = this.basicBlock2.previousConnection;

      defaultRegistration.navigation.connect_(cursorLocation, markedLocation);

      assert.equal(this.basicBlock.nextConnection.targetBlock(), this.basicBlock3);
      assert.equal(this.basicBlock2.previousConnection.targetBlock(), this.basicBlock4);

    });

    test('Connect cursor on next into stack', function() {
      const markedLocation = this.basicBlock2.previousConnection;
      const cursorLocation = this.basicBlock4.nextConnection;

      defaultRegistration.navigation.connect_(cursorLocation, markedLocation);

      assert.equal(this.basicBlock.nextConnection.targetBlock(), this.basicBlock4);
      assert.isNull(this.basicBlock3.nextConnection.targetConnection);
    });

    test('Connect cursor with parents', function() {
      const markedLocation = this.basicBlock3.previousConnection;
      const cursorLocation = this.basicBlock2.nextConnection;

      defaultRegistration.navigation.connect_(cursorLocation, markedLocation);

      assert.equal(this.basicBlock3.previousConnection.targetBlock(), this.basicBlock2);
    });

    test('Try to connect input that is descendant of output', function() {
      const markedLocation = this.inlineBlock2.inputList[0].connection;
      const cursorLocation = this.inlineBlock1.outputConnection;

      defaultRegistration.navigation.connect_(cursorLocation, markedLocation);

      assert.isNull(this.inlineBlock2.outputConnection.targetBlock());
      assert.equal(this.inlineBlock1.outputConnection.targetBlock(), this.inlineBlock2);
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
      this.basicBlockA = this.workspace.newBlock('basic_block');
      this.basicBlockB = this.workspace.newBlock('basic_block');
    });

    teardown(function() {
      this.workspace.dispose();
      sinon.restore();
    });

    test('Delete block - has parent ', function() {
      this.basicBlockA.nextConnection.connect(this.basicBlockB.previousConnection);
      const astNode = Blockly.ASTNode.createBlockNode(this.basicBlockB);
      // Set the cursor to be on the child block
      this.workspace.getCursor().setCurNode(astNode);
      // Remove the child block
      this.basicBlockB.dispose();
      assert.equal(this.workspace.getCursor().getCurNode().getType(),
          Blockly.ASTNode.types.NEXT);
    });

    test('Delete block - no parent ', function() {
      const astNode = Blockly.ASTNode.createBlockNode(this.basicBlockB);
      this.workspace.getCursor().setCurNode(astNode);
      this.basicBlockB.dispose();
      assert.equal(this.workspace.getCursor().getCurNode().getType(),
          Blockly.ASTNode.types.WORKSPACE);
    });

    test('Delete parent block', function() {
      this.basicBlockA.nextConnection.connect(this.basicBlockB.previousConnection);
      const astNode = Blockly.ASTNode.createBlockNode(this.basicBlockB);
      // Set the cursor to be on the child block
      this.workspace.getCursor().setCurNode(astNode);
      // Remove the parent block
      this.basicBlockA.dispose();
      assert.equal(this.workspace.getCursor().getCurNode().getType(),
          Blockly.ASTNode.types.WORKSPACE);
    });

    test('Delete top block in stack', function() {
      this.basicBlockA.nextConnection.connect(this.basicBlockB.previousConnection);
      const astNode = Blockly.ASTNode.createStackNode(this.basicBlockA);
      // Set the cursor to be on the stack
      this.workspace.getCursor().setCurNode(astNode);
      // Remove the top block in the stack
      this.basicBlockA.dispose();
      assert.equal(this.workspace.getCursor().getCurNode().getType(),
          Blockly.ASTNode.types.WORKSPACE);
    });
  });
});
