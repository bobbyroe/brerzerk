import * as keyboard from "./keyboard.js"; // ***
import { hitTestAll, showSplashScreen, hideSplashScreen } from "./utils.js"; //***
import { getPlayer } from "./player.js";
import { getRobot } from "./robot.js";
import { getEvilOtto } from "./evilotto.js";
import { drawWalls, getPossiblePositions, resetScoreDisplay } from "./layout.js"; // ***
/*******************************************************************************
 * gameStates.js
 ******************************************************************************/
var initGameStates = (function () {

return function (game_objs) {
	let gameState = null;
	let {
		player,	evil_otto, walls, robots, bullets, robot_bullets, 
		max_robot_bullets, is_game_restarting, 
		timer, next_bullet_time, game_over_timer, 
		enemy_color, score, level_bonus, num_players_remaining, 
		pubSub,	start_pos, 
		stage, maze, sound, renderer
	} = game_objs;

	function initializeGame () {
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

	function gameRestarting () {
		
		// clean up
		maze.x = 0;
		maze.y = 0;
		maze.removeChildren();
		walls = [];
		robots = [];
		keyboard.removeListeners();
		hideSplashScreen();

		resetScoreDisplay();

		timer = 0;
		next_bullet_time = 150;
		enemy_color = getEnemyColor();
		max_robot_bullets = getMaxNumRobotBullets();
		
		if (num_players_remaining > 0) {
			player = getPlayer({stage, sound, pubSub, is_game_restarting, start_pos, timer, bullets, next_bullet_time, num_players_remaining});
			maze.addChild(player);
			drawWalls();
			gameState = gameStart;
			is_game_restarting = false; 

		} else { // RESET
			score = 0;
			num_players_remaining = 3;
			game_over_timer = timer + 30;
			gameState = gameOver;
			is_game_restarting = true;
		}
		let pos = {x: 0, y: 0};
		evil_otto = getEvilOtto({enemy_color, pos, evil_otto, player, sound, timer, robots, maze}); // keep him offscreen for now
	}

	// GAME PLAY LOOP
	function gameLoop() {

		requestAnimationFrame(gameLoop);
		timer += 1;
		gameState();
		renderer.render(stage);
		console.log('gameLoop!');
	}

	var x_vel = 0;
	var y_vel = 0;

	function prepareToExitLevel (side) {

		maze.children.forEach( function (child) {
			child.tint = 0x0000FF;
		});

		x_vel = 0;
		y_vel = 0;
		var rate = 7;
		switch (side) {
			case 'top': 
			x_vel = 0;
			y_vel = rate * 1;
			start_pos = {x: maze.width * 0.5, y: maze.height - player.height - 100};
			break;
			case 'right': 
			x_vel = rate * -1;
			y_vel = 0;
			start_pos = {x: 90, y: maze.height * 0.5};
			break;
			case 'bottom': 
			x_vel = 0;
			y_vel = rate * -1;
			start_pos = {x: maze.width * 0.5, y: 90};
			break;
			case 'left': 
			x_vel = rate;
			y_vel = 0;
			start_pos = {x: maze.width - player.width - 100, y: maze.height * 0.5};
			break;
		}

		// robot talk to player
		if (robots.length !== 0) {
			sound.play('chicken');
			sound.playSequence('chicken fight like a robot'.split(' '));
		} else {
			sound.playSequence('the humanoid must not escape'.split(' '));
		}
		gameState = exitingLevel;
	}

	function exitingLevel () {

		if (maze.x + maze.width < -50 || 
			maze.x > maze.width + 50 ||
			maze.y + maze.height < -50 ||
			maze.y > maze.height + 50) {
				gameState = gameRestarting;
		} else { 
			maze.x += x_vel;
			maze.y += y_vel;
		}
	}

	// PRIVATE
	function gameStart () {

		player.visible = true;
		robots = getRobots();
		for (var r = 0, r_len = robots.length; r < r_len; r++) {
			maze.addChild(robots[r]);
		}
		evil_otto.delay_timer = robots.length * 115;
		level_bonus = robots.length * 10;

		//
		// play a random robot speach bit
		// var SPACE = keyboard.handle('Space');
		// SPACE.press = function () { 
		// 	var snds = Object.keys(talking_audio);
		// 	var id = sound.play(snds[Math.floor(Math.random() * snds.length)]); 
		// 	var random_rate = Math.random() + 0.5;
		// 	sound.rate(random_rate, id);
		// };
		// SPACE.release = function () { /* no op */ };

		// toggle : pause the game
		var ESC = keyboard.handle('Escape');
		ESC.press = function () { 
			gameState = (gameState === gamePlay) ? gamePaused : gamePlay;
		};
		ESC.release = function () { /* no op */ };
		//

		gameState = gamePlay;
		
	}

	function gameDormant () {
		renderer.view.hidden = true;
		showSplashScreen();
	}

	function gamePlay () {

		hitTestAll({player, evil_otto, walls, robots, bullets, robot_bullets});
		player.tick();
		evil_otto.tick();
		updateRobots();
		updateBullets(); // score, etc ... including debug stuff – in layout.js
	}

	function gamePaused () { /* no op */ }

	function gameOver () {

		if (timer > game_over_timer) {
			gameState = resetGameState;
		} else {
			renderer.view.hidden = true;
			// splash_header.textContent = "GAME OVER";
		}
	}

	function updateBullets () {

		for (var i = 0, s_len = bullets.length; i < s_len; i++) {
			bullets[i].tick();
		}
		for (var j = 0, rs_len = robot_bullets.length; j < rs_len; j++) {
			robot_bullets[j].tick();
		}
	}

	function updateRobots () {

		for (var i = 0, r_len = robots.length; i < r_len; i++) {
			robots[i].tick();
		}
	}

	// robots
	function getRobots () {

		var robots = [];
		var max_num_robots = 12, min_num_robots = 3;
		var num_robots = Math.floor(Math.random() * (max_num_robots - min_num_robots)) + min_num_robots;
		var possible_positions = getPossiblePositions();
		var robot, robot_pos;

		for (var r = 0; r < num_robots; r++) {

			robot = getRobot({enemy_color, sound, pubSub, timer, next_bullet_time, robots, score, player, robot_bullets, max_robot_bullets, maze});

			var random_index = Math.floor(Math.random() * possible_positions.length);
			robot_pos = possible_positions.splice(random_index, 1)[0];
			robot_pos.x += Math.floor(Math.random() * 50) - 25;
			robot_pos.y += Math.floor(Math.random() * 50) - 25;
			robot.position.set(robot_pos.x, robot_pos.y);
			robot.index = r;

			robots.push(robot);
		}
		return robots;
	}

	// for robots and evil otto
	/*
		Dark yellow robots that do not fire
		Red robots that can fire 1 bullet (500 points)
		Dark cyan robots that can fire 2 bullets (1,500 points)
		Green robots that fire 3 bullets (3k)
		Dark purple robots that fire 4 bullets (4.5k)
		Light yellow robots that fire 5 bullets (6k)
		White robots that fire 1 fast bullet (7.5k)
		Dark cyan robots that fire 2 fast bullets (10k)
		Light purple robots that fire 3 fast bullets (11k)
		Gray robots that fire 4 fast bullets (13k)
		Dark yellow robots that fire 5 fast bullets (15k)
		Red robots that fire 5 fast bullets (17k)
		Light cyan robots that fire 5 fast bullets (19k)
	*/
	var score_tiers = [500, 1500, 3000, 4500, 6000, 7500, 10000, 11000, 13000, 15000, 17000, 19000];
	function getEnemyColor () {

		var colors = [0xFFFF00, 0xFF0000, 0x00FFFF, 0x00FF00, 0xFF00FF, 0xFFFF00, 0xFFFFFF, 0x00FFFF, 0xFF00FF];
		var col = colors[0];

		if (score >= score_tiers[0]) { col = colors[1]; }
		if (score >= score_tiers[1]) { col = colors[2]; }
		if (score >= score_tiers[2]) { col = colors[3]; }
		if (score >= score_tiers[3]) { col = colors[4]; }
		if (score >= score_tiers[4]) { col = colors[5]; }
		if (score >= score_tiers[5]) { col = colors[6]; }
		if (score >= score_tiers[6]) { col = colors[7]; }
		if (score >= score_tiers[7]) { col = colors[8]; }
		if (score >= score_tiers[8]) { col = Math.floor(Math.random() * 0xFFFFFF); } // MAX
		return col;
	}

	function getMaxNumRobotBullets () {

		var num_bullets = [0, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
		var num = num_bullets[0];

		if (score >= score_tiers[0]) { num = num_bullets[1]; }
		if (score >= score_tiers[1]) { num = num_bullets[2]; }
		if (score >= score_tiers[2]) { num = num_bullets[3]; }
		if (score >= score_tiers[3]) { num = num_bullets[4]; }
		if (score >= score_tiers[4]) { num = num_bullets[5]; }
		if (score >= score_tiers[5]) { num = num_bullets[6]; } // fast bullets
		if (score >= score_tiers[6]) { num = num_bullets[7]; }
		if (score >= score_tiers[7]) { num = num_bullets[8]; }
		if (score >= score_tiers[8]) { num = 5;  			 } // MAX
		return num;
	}

	return {
		init: initializeGame,
		prepareToExitLevel,
		restart: function () { gameState = gameRestarting; }
	};
};
})();

export { initGameStates };