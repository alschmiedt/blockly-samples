lit# blockly-plugin-keyboard-navigation [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

<!--
  - TODO: Edit plugin description.
  -->
A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds keyboard
navigation to Blockly. This allows users to use the keyboard to navigate the
toolbox and the blocks. More information on keyboard navigation can be found
on our [keyboard navigation documentation page](https://developers.google.com/blockly/guides/configure/web/keyboard-nav).

## Installation

### Yarn
```
yarn add blockly-plugin-keyboard-navigation
```

### npm
```
npm install blockly-plugin-keyboard-navigation --save
```

## Usage

```js
import * as Blockly from 'blockly';
import {Register} from 'blockly-plugin-keyboard-navigation';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});

// Initialize plugin.
const keyboardNavigation = new KeyboardNavigation();
keyboardNavigation.init();
keyboardNavigation.addWorkspace(workspace);
```

## API
This plugin exports the following classes:
- `KeyboardNavigation`: Class in charge of registering all keyboard shortcuts.
- `NavigationHelper`: The meat of the plugin. This holds all the functions that are used in the keyboard shortcuts. 
- `FlyoutCursor`: Cursor in charge of navigating the flyout.
- `LineCursor`: Cursor that tries to navigate blocks like lines of code.

You should only need to use these if you plan on changing the default functionality.

## License
Apache 2.0
