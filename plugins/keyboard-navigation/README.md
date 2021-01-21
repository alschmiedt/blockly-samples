lit# blockly-plugin-keyboard-navigation [![Built on Blockly](https://tinyurl.com/built-on-blockly)](https://github.com/google/blockly)

<!--
  - TODO: Edit plugin description.
  -->
A [Blockly](https://www.npmjs.com/package/blockly) plugin that adds keyboard
navigation to Blockly. This allows users to use the keyboard to navigate the
toolbox and the workspace using the keyboard.

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

<!--
  - TODO: Update usage.
  -->
```js
import * as Blockly from 'blockly';
import {Plugin} from 'blockly-plugin-keyboard-navigation';

// Inject Blockly.
const workspace = Blockly.inject('blocklyDiv', {
  toolbox: toolboxCategories,
});

// Initialize plugin.
const plugin = new Plugin(workspace);
plugin.init();
```

## API

<!--
  - TODO: describe the API.
  -->

## License
Apache 2.0
