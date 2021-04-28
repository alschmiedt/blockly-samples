import * as Blockly from 'blockly';

class SearchItem extends Blockly.ToolboxItem {
  init() {
      this.createDom_();
  }
  createDom_() {
    this.container = document.createElement('div');
    this.textInput = document.createElement('input');
    this.container.appendChild(this.textInput);
  }
  getDiv() {
    return this.container;
  }
}

Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM, 'searchItem', SearchItem);
