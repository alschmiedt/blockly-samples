/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Music game controller.
 */


import MicroModal from 'micromodal';
import {Music} from './music';
import {HelpModal} from './help_modal';
import {KeyPressModal} from './key_press_modal';
import {WelcomeModal} from './welcome_modal';
import {speaker} from './speaker';
import {Tutorial} from './tutorial';

/**
 * Class for a controller for the music game, which handles
 * creation of the game and coordination of related modals, tutorials,
 * etc.
 */
export class MusicGameController {
  /**
   * The constructor for the music game controller.
   */
  constructor() {
    MicroModal.init({
      onClose: () => speaker.cancel(),
    });

    /**
     * The actual game object.
     * @type {Music}
     */
    this.game = new Music();
    this.game.loadLevel(1);
    this.game.setOnSuccessCallback(() => {
      this.game.setFeedbackText('Congratulations. You did it!');
    });
    this.game.setOnFailureCallback((feedback) => {
      this.game.setFeedbackText(feedback.replaceAll('\n', '<br>'));
    });

    const helpModal = new HelpModal('modal-1', 'modalButton');
    helpModal.init();

    // Start by showing the key press modal.
    new KeyPressModal(() => this.showWelcomeModal()).init();
  }

  /**
   * Get the current game object.
   * @return {Music} The current game object.
   */
  getGame() {
    return this.game;
  }

  /**
   * Start the tutorial.
   */
  runTutorial() {
    new Tutorial(this.game.getWorkspace()).init();
  }

  /**
   * Show the welcome modal.
   */
  showWelcomeModal() {
    new WelcomeModal(() => this.runTutorial()).init();
  }
}