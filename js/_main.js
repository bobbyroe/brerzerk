import { Events } from "./events.js"; // ***
import { getHowlerAudio } from "./audio.js"; // ***
import * as keyboard from "./keyboard.js"; // ***
import { createGameUIBits } from "./utils.js"; //***
import { getRobot } from "./robot.js";
import { getPossiblePositions, handleAllRobotsKilled } from "./layout.js"; // ***
import { gameRestarting, gameDormant, prepareToExitLevel, exitingLevel } from "./gameStates.js";
/*******************************************************************************
 * main.js
 ******************************************************************************/
pubSub = new Events();
sound = getHowlerAudio();

// make stuff look pixelated
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
// https://github.com/kittykatattack/learningPixi#pixis-graphic-primitives

// Setup
document.body.appendChild(renderer.view);

// debug_timer, score, game over screen ...
createGameUIBits();

renderer.render(stage);
stage.addChild(maze);

// APP STARTS-UP HERE ...
PIXI.loader
	.add("images/robot.png")
	.add("images/robot-explode.png")
	.add("images/player.png")
	.add("images/evil-otto.png")
	.add("images/charset.png")
	.load(setup);

function setup() {
	
	pubSub.listenTo(window, 'all_robots_killed', handleAllRobotsKilled);
	pubSub.listenTo(window, 'player_is_exiting', handlePlayerExiting);

	keyboard.init();
	resetGameState();
	gameLoop();	
}

function resetGameState () {
	// listen for any key
	function fn () { 
		window.removeEventListener("keydown", fn); 
		gameState = gameRestarting;
		renderer.view.hidden = false;
	}
	window.addEventListener("keydown", fn, false);
	gameState = gameDormant;
}

// GAME PLAY LOOP
function gameLoop() {

	requestAnimationFrame(gameLoop);
	timer += 1;
	gameState();
	renderer.render(stage);
}

function handlePlayerExiting (exit_side) {
	prepareToExitLevel(exit_side);
	gameState = exitingLevel;
}

