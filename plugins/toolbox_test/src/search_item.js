import * as Blockly from 'blockly';

class SearchItem extends Blockly.ToolboxItem {
  init() {
      this.createDom_();
  }
  createDom_() {
    this.container = document.createElement('div');
    this.container.textContent = 'Search:';
    this.textInput = document.createElement('input');
    this.container.appendChild(this.textInput);
    this.container.classList.add('customClass');
    this.addEvent_(this.textInput, 'input', this, () =>this.onInput_());
  }
  getDiv() {
    return this.container;
  }

  onClick() {}

  addEvent_(node, name, thisObject, func) {
    const event = Blockly.bindEventWithChecks_(node, name, thisObject, func);
  }

  onInput_() {
    this.parentToolbox_.refreshSelection();
  }

  getAllBlocks() {
    const searchText = this.textInput.value;
    let contents = [];
    for (const toolboxItem of this.parentToolbox_.getToolboxItems()) {
      if (toolboxItem instanceof Blockly.ToolboxCategory) {
        /**
         * @type {string|Blockly.utils.toolbox.FlyoutItemInfoArray|
         *    Blockly.utils.toolbox.FlyoutItemInfo}
         */
        let itemContents = toolboxItem.getContents();

        // Handle custom categories (e.g. variables and functions)
        if (typeof itemContents === 'string') {
          itemContents =
            /** @type {!Blockly.utils.toolbox.DynamicCategoryInfo} */ ({
              custom: itemContents,
              kind: 'CATEGORY',
            });
        }
        for (const item of itemContents) {
            console.log(item);
          if (item['kind'] == 'block' && item['type'].indexOf(searchText) > -1) {
            contents = contents.concat(item);
          }
        }
      }
    }
    return contents;
  }

  getClickTarget() {
    return this.container;
  }

  setSelected(isSelected) {
    if (isSelected) {
      this.textInput.focus();
    } else {
      this.textInput.blur();
      this.parentToolbox_.contentsDiv_.focus();
    }
  }
  getContents() {
    return this.getAllBlocks();
  }

  getName() {
    return 'SearchItem';
  }
  isSelectable() {
    return true;
  }
  dispose() {
    Blockly.utils.dom.removeNode(this.container);
  }
}

Blockly.Css.register([`
     .customClass {
       padding: .5em;
     } 
 `]);

Blockly.registry.register(
    Blockly.registry.Type.TOOLBOX_ITEM, 'searchItem', SearchItem);
