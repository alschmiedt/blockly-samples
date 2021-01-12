/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Constants from '../src/constants';

import {AddOnShortcut} from './add_on_shortcut';
import {FlyoutCursor, pluginInfo as FlyoutCursorPluginInfo} from './flyout_cursor';
import {LineCursor, pluginInfo as LineCursorPluginInfo} from './line_cursor';
import {Navigation} from './navigation';
import {defaultRegister, Register} from './register_shortcuts';

// TODO: Finish this, what to do with gesture?
export {
  AddOnShortcut,
  Constants,
  defaultRegister,
  FlyoutCursor,
  FlyoutCursorPluginInfo,
  LineCursor,
  LineCursorPluginInfo,
  Navigation,
  Register,
};
