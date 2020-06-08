/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Entry point for the Blockly playground.
 * @author samelh@google.com (Sam El-Husseini)
 */

import * as Blockly from 'blockly/core';
import * as BlocklyJS from 'blockly/javascript';
import * as BlocklyPython from 'blockly/python';
import * as BlocklyLua from 'blockly/lua';
import * as BlocklyDart from 'blockly/dart';
import * as BlocklyPHP from 'blockly/php';

import {renderPlayground, renderCheckbox, renderCodeTab} from './ui';
import {addCodeEditor} from './monaco';
import {addGUIControls} from '../addGUIControls';
import {LocalStorageState} from './state';


/**
 * @typedef {function(!HTMLElement,!Blockly.BlocklyOptions):Blockly.Workspace}
 */
let CreateWorkspaceFn;

/**
 * @typedef {{
 *     generate: function():void,
 *     state: ?,
 *     tabElement: !HTMLElement,
 * }}
 */
let PlaygroundTab;

/**
 * @typedef {{
 *     auto:?boolean,
 *     toolboxes:Array<Blockly.utils.toolbox.ToolboxDefinition>,
 * }}
 */
let PlaygroundConfig;

/**
 * @typedef {{
 *     state: ?,
 *     addAction:function(string,function(!Blockly.Workspace):void,string=):
 *         dat.GUI,
 *     addCheckboxAction:function(string,
 *         function(!Blockly.Workspace,boolean):void,string=,boolean=):dat.GUI,
 *     addGenerator: function(string,!Blockly.Generator,string=):void,
 *     getCurrentTab: function():!PlaygroundTab,
 *     getGUI: function():!dat.GUI,
 *     getWorkspace: function():!Blockly.WorkspaceSvg,
 * }}
 */
let PlaygroundAPI;

/**
 * Create the Blockly playground.
 * @param {!HTMLElement} container Container element.
 * @param {CreateWorkspaceFn} createWorkspace A workspace creation method called
 *     every time the toolbox is re-configured.
 * @param {Blockly.BlocklyOptions} defaultOptions The default workspace options
 *     to use.
 * @param {PlaygroundConfig=} config Optional Playground config.
 * @param {string=} vsEditorPath Optional editor path.
 * @return {Promise<PlaygroundAPI>} A promise to the playground API.
 */
export function createPlayground(container, createWorkspace,
    defaultOptions, config, vsEditorPath) {
  const {blocklyDiv, monacoDiv, guiContainer, tabButtons, tabsDiv} =
    renderPlayground(container);

  // Load the code editor.
  return addCodeEditor(monacoDiv, {
    model: null,
    language: 'xml',
    minimap: {
      enabled: false,
    },
    theme: 'vs-dark',
    scrollBeyondLastLine: false,
    automaticLayout: true,
  }, vsEditorPath).then((editor) => {
    let workspace;

    // Create a model for displaying errors.
    const errorModel = window.monaco.editor.createModel('');
    const editorXmlContextKey = editor.createContextKey('isEditorXml', true);

    // Load / Save playground state.
    const playgroundState = new LocalStorageState('playgroundState', {
      activeTab: 'XML',
      autoGenerate: config && config.auto != undefined ? config.auto : true,
      workspaceXml: '',
    });
    playgroundState.load();

    /**
     * Register a generator and create a new code tab for it.
     * @param {string} name The generator label.
     * @param {string} language The monaco language to use.
     * @param {Blockly.Generator} generator The Blockly generator.
     * @param {boolean=} isReadOnly Whether the editor should be set to
     *     read-only mode.
     * @return {!PlaygroundTab} An object that represents the newly created tab.
     */
    function registerGenerator(name, language, generator, isReadOnly) {
      const tabElement = renderCodeTab(name);
      tabElement.setAttribute('data-tab', name);
      tabsDiv.appendChild(tabElement);

      // Create a monaco editor model for each tab.
      const model = window.monaco.editor.createModel('', language);
      const state = {
        name,
        model,
        language,
        viewState: undefined,
      };

      /**
       * Call the generator, displaying an error message if it fails.
       */
      function generate() {
        let text;
        let generateModel = model;
        try {
          text = generator(workspace);
        } catch (e) {
          console.error(e);
          text = e.message;
          generateModel = errorModel;
          editor.updateOptions({
            wordWrap: true,
          });
        }
        generateModel.pushEditOperations([],
            [{range: generateModel.getFullModelRange(), text}], () => null);
        editor.setModel(generateModel);
        editor.setSelection(new window.monaco.Range(0, 0, 0, 0));
      }

      const tab = {
        generate,
        state,
        tabElement,
      };
      return tab;
    }

    /**
     * Set the active tab.
     * @param {!PlaygroundTab} tab The new tab.
     */
    const setActiveTab = (tab) => {
      currentTab = tab;
      currentGenerate = tab.generate;
      const isXml = tab.state.name == 'XML';
      editor.setModel(currentTab.state.model);
      editor.updateOptions({
        readOnly: !isXml,
        wordWrap: false,
      });

      // Update tab UI.
      Object.values(tabs).forEach((t) =>
        t.tabElement.style.background =
          (t.tabElement == tab.tabElement) ? '#1E1E1E' : '#2D2D2D');
      // Update editor state.
      editorXmlContextKey.set(isXml);
      playgroundState.set('activeTab', tab.state.name);
      playgroundState.save();
    };

    /**
     * Call the current generate method if we are in 'auto' mode. In addition,
     * persist the current workspace xml regardless of which tab we are in.
     */
    const updateEditor = () => {
      if (playgroundState.get('autoGenerate')) {
        if (initialWorkspaceXml && isFirstLoad) {
          isFirstLoad = false;
          Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(initialWorkspaceXml),
              workspace);
        }

        currentGenerate();

        playgroundState.set('workspaceXml', Blockly.Xml.domToPrettyText(
            Blockly.Xml.workspaceToDom(workspace)));
        playgroundState.save();
      }
    };

    // Register default tabs.
    const tabs = {
      'XML': registerGenerator('XML', 'xml', (ws) =>
        Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(ws))),
      'JavaScript': registerGenerator('JavaScript', 'javascript',
          (ws) => BlocklyJS.workspaceToCode(ws), true),
      'Python': registerGenerator('Python', 'python',
          (ws) => BlocklyPython.workspaceToCode(ws), true),
      'Dart': registerGenerator('Dart', 'javascript',
          (ws) => BlocklyDart.workspaceToCode(ws), true),
      'Lua': registerGenerator('Lua', 'lua',
          (ws) => BlocklyLua.workspaceToCode(ws), true),
      'PHP': registerGenerator('PHP', 'php',
          (ws) => BlocklyPHP.workspaceToCode(ws), true),
    };

    // Handle tab click.
    tabsDiv.addEventListener('click', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      const tabName = target.getAttribute('data-tab');
      if (!tabName) {
        // Not a tab.
        return;
      }
      const tab = tabs[tabName];

      // Save current tab state (eg: scroll position).
      currentTab.state.viewState = editor.saveViewState();

      setActiveTab(tab);
      updateEditor();

      // Restore tab state (eg: scroll position).
      editor.restoreViewState(currentTab.state.viewState);
      editor.focus();
    });

    // Initialized saved XML and bind change listener.
    const initialWorkspaceXml = playgroundState.get('workspaceXml') || '';
    const xmlTab = tabs['XML'];
    const xmlModel = xmlTab.state.model;
    let isFirstLoad = true;
    xmlModel.setValue(initialWorkspaceXml);
    xmlModel.onDidChangeContent(() => {
      playgroundState.set('workspaceXml', xmlModel.getValue());
      playgroundState.save();
    });

    // Set the initial tab as active.
    let currentTab = tabs[playgroundState.get('activeTab')];
    let currentGenerate;
    setActiveTab(currentTab);

    // Load the GUI controls.
    const gui = addGUIControls((options) => {
      workspace = createWorkspace(blocklyDiv, options);

      updateEditor();
      workspace.addChangeListener((e) => {
        if (e.type !== 'ui') {
          updateEditor();
        }
      });
      return workspace;
    }, defaultOptions, config);
    (/** @type {?} */ (gui)).setResizeEnabled(false);

    // Move the GUI Element to the gui container.
    const guiElement = gui.domElement;
    guiElement.removeChild(guiElement.firstChild);
    guiElement.style.top = '0';
    guiElement.style.position = 'relative';
    guiElement.style.minWidth = '100%';
    guiContainer.appendChild(guiElement);

    // Playground API.

    /**
     * Get the current GUI controls.
     * @return {!dat.GUI} The GUI controls.
     */
    const getGUI = function() {
      return gui;
    };

    /**
     * Get the current workspace.
     * @return {!Blockly.WorkspaceSvg} The Blockly workspace.
     */
    const getWorkspace = function() {
      return workspace;
    };

    /**
     * Get the current tab.
     * @return {!PlaygroundTab} The current tab.
     */
    const getCurrentTab = function() {
      return currentTab;
    };

    /**
     * Add a generator tab.
     * @param {string} label The label of the generator tab.
     * @param {Blockly.Generator} generator The Blockly generator.
     * @param {string=} language Optional editor language, defaults to
     *     'javascript'.
     */
    const addGenerator = function(label, generator, language) {
      if (!label || !generator) {
        throw Error('usage: addGenerator(label, generator, language?);');
      }
      tabs[label] = registerGenerator(label, language || 'javascript',
          (ws) => generator.workspaceToCode(ws), true);
    };

    const playground = {
      state: playgroundState,
      addAction: (/** @type {?} */ (gui)).addAction,
      addCheckboxAction: (/** @type {?} */ (gui)).addCheckboxAction,
      addGenerator,
      getCurrentTab,
      getGUI,
      getWorkspace,
    };

    // Add tab buttons.
    registerTabButtons(editor, playground, tabButtons, updateEditor);

    // Register editor commands.
    registerEditorCommands(editor, playground);

    return playground;
  });
}

/**
 * Register tab buttons.
 * @param {monaco.editor.IStandaloneCodeEditor} editor The monaco editor.
 * @param {PlaygroundAPI} playground The current playground.
 * @param {!HTMLElement} tabButtons Tab buttons element wrapper.
 * @param {function():void} updateEditor Update Editor method.
 */
function registerTabButtons(editor, playground, tabButtons, updateEditor) {
  const [autoGenerateCheckbox, autoGenerateLabel] =
    renderCheckbox('autoGenerate', 'Auto');
  /** @type {HTMLInputElement} */ (autoGenerateCheckbox).checked =
    playground.state.get('autoGenerate');
  autoGenerateCheckbox.addEventListener('change', (e) => {
    const inputTarget = /** @type {HTMLInputElement} */ (e.target);
    playground.state.set('autoGenerate', !!inputTarget.checked);
    playground.state.save();

    updateEditor();
  });
  tabButtons.appendChild(autoGenerateCheckbox);
  tabButtons.appendChild(autoGenerateLabel);
}

/**
 * Register editor commands / shortcuts.
 * @param {monaco.editor.IStandaloneCodeEditor} editor The monaco editor.
 * @param {PlaygroundAPI} playground The current playground.
 */
function registerEditorCommands(editor, playground) {
  // Add XMl Import action (only available on the XML tab).
  editor.addAction({
    id: 'import-xml',
    label: 'Import from XML',
    keybindings: [
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter,
    ],
    precondition: 'isEditorXml',
    contextMenuGroupId: 'playground',
    contextMenuOrder: 0,
    run: () => {
      const xml = editor.getModel().getValue();
      const workspace = playground.getWorkspace();
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(xml), workspace);
    },
  });
  // Add XMl Export action (only available on the XML tab).
  editor.addAction({
    id: 'export-xml',
    label: 'Export to XML',
    keybindings: [
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_S,
    ],
    precondition: 'isEditorXml',
    contextMenuGroupId: 'playground',
    contextMenuOrder: 1,
    run: () => {
      playground.getCurrentTab().generate();
    },
  });
  editor.addAction({
    id: 'clean-xml',
    label: 'Clean XML',
    precondition: 'isEditorXml',
    contextMenuGroupId: 'playground',
    contextMenuOrder: 2,
    run: () => {
      const model = editor.getModel();
      const text = model.getValue().replace(/ (x|y|id)="[^"]*"/gmi, '');
      model.pushEditOperations([],
          [{range: model.getFullModelRange(), text}], () => null);
      editor.setSelection(new window.monaco.Range(0, 0, 0, 0));
    },
  });
  // Add a Generator generate action.
  editor.addAction({
    id: 'generate',
    label: 'Generate',
    keybindings: [
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KEY_S,
    ],
    precondition: '!isEditorXml',
    contextMenuGroupId: 'playground',
    contextMenuOrder: 1,
    run: () => {
      playground.getCurrentTab().generate();
    },
  });
}
