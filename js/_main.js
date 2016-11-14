import { Events } from "./events.js"; // ***
import { getHowlerAudio } from "./audio.js"; // ***
import * as keyboard from "./keyboard.js"; // ***
import { createGameUIBits } from "./utils.js"; //***
import { initLayout, handleAllRobotsKilled } from "./layout.js"; // ***
import { initGameStates } from "./gameStates.js";
/*******************************************************************************
 * main.js
 ******************************************************************************/
 // GLOBALS
 let player = null;
 let evil_otto = null;
 let walls = [];
 let robots = [];
 let bullets = [];
 let robot_bullets = [];
 let max_robot_bullets = 1;

 let is_game_restarting = true;

 let timer = 0;
 let next_bullet_time = 150;
 let game_over_timer = -1;

 let enemy_color = 0x000000;
 let score = 0;
 let level_bonus = 0;
 let num_players_remaining = 3;

 let pubSub =  new Events();
 let start_pos = {x: 90, y: 300};

 let stage = new PIXI.Container();
 let maze = new PIXI.Container();
 let sound = getHowlerAudio();

 let renderer = PIXI.autoDetectRenderer(
 	1024, 768, 
 	{antialias: false, transparent: false, resolution: 1}
 );

let game = initGameStates({ 
	player,	evil_otto, walls, robots, bullets, robot_bullets, 
	max_robot_bullets, is_game_restarting, 
	timer, next_bullet_time, game_over_timer, 
	enemy_color, score, level_bonus, num_players_remaining, 
	pubSub,	start_pos, 
	stage, maze, sound, renderer
});
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
	pubSub.listenTo(window, 'player_has_died', handlePlayerDied);

	initLayout({ score, start_pos, is_game_restarting, maze, walls, level_bonus, stage, num_players_remaining });
	keyboard.init();
	game.init();
}

function handlePlayerExiting (exit_side) {
	game.prepareToExitLevel(exit_side);
}

function handlePlayerDied () {
	game.restart();
}
