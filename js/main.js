
// Aliases
var Rectangle = PIXI.Rectangle;
var Container = PIXI.Container;
var autoDetectRenderer = PIXI.autoDetectRenderer;
var loader = PIXI.loader;
var TextureCache = PIXI.utils.TextureCache;
var Sprite = PIXI.Sprite;
var Grfx = PIXI.Graphics;
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
// https://github.com/kittykatattack/learningPixi#pixis-graphic-primitives

/*******************************************************************************
 * Setup
 *******************************************************************************/
var player;
var evil_otto;
var gameState;
var timer = 0;
var num_players_remaining = 3;
var walls = [];
var robots = [];
var DEBUG = false;
var bullets = [];
var max_bullets = 2;
var next_bullet_time = 150;
var enemy_color = 0x000000;
var robot_bullets = [];
var listeners = [];
var robots_awake_time = 150;
var score = 0;
var level_bonus = 0;
var game_over_timer = -1;

// exit level velocity
var x_vel = 0;
var y_vel = 0;
var start_pos = {x: 90, y: 300};

var renderer = autoDetectRenderer(
	1024, 768, 
	{antialias: false, transparent: false, resolution: 1}
);
document.body.appendChild(renderer.view);

// debug_timer, score, game over screen ...
createGameUIBits();

var stage = new Container();
renderer.render(stage);

var maze = new Container();
stage.addChild(maze);

// APP STARTS-UP HERE ...
loader
	.add("images/robot.png")
	.add("images/robot-explode.png")
	.add("images/player.png")
	.add("images/evil-otto.png")
	.add("images/charset.png")
	.load(setup);

var sound = getHowlerAudio();

function setup() {
	resetGameState();
	gameLoop();	
}

function resetGameState () {
	// listen for any key
	function fn (evt) { 
		window.removeEventListener("keydown", fn); 
		gameState = gameRestarting;
		renderer.view.hidden = false;
	}
	window.addEventListener("keydown", fn, false);
	gameState = gameDormant;
}

/*******************************************************************************
 * GAME PLAY LOOP
 *******************************************************************************/
function gameLoop() {

	requestAnimationFrame(gameLoop);
	timer += 1;
	gameState();
	renderer.render(stage);
}

function gameRestarting () {
	
	// clean up
	maze.x = 0;
	maze.y = 0;
	maze.removeChildren();
	walls = [];
	robots = [];
	removeListeners();
	anykey_subhead.textContent = "";
	logo_img.style.display = 'none';

	resetScoreDisplay();

	timer = 0;
	next_bullet_time = 150;
	enemy_color = getEnemyColor();
	max_robot_bullets = getMaxNumRobotBullets();
	
	if (num_players_remaining > 0) {
		player = getPlayer(start_pos);
		maze.addChild(player);
		drawWalls();
		gameState = gameStart;  

	} else { // RESET
		score = 0;
		num_players_remaining = 3;
		game_over_timer = timer + 30;
		gameState = gameOver;
	}
	evil_otto = getEvilOtto({x: 0, y: 0}); // keep him offscreen for now
}

function gameStart () {

	// blink player location
	if (timer < player.blinking_duration) {
		player.visible = (timer % 40 > 20);

	// start!
	} else {
		player.visible = true;
		robots = getRobots();
		for (var r = 0, r_len = robots.length; r < r_len; r++) {
			maze.addChild(robots[r]);
		}
		evil_otto.delay_timer = robots.length * 110;
		level_bonus = robots.length * 10;

		//
		var SPACE = keyboard('Space');
		SPACE.press = function () { 
			var snds = Object.keys(talking_audio);
			var id = sound.play(snds[Math.floor(Math.random() * snds.length)]); 
			var random_rate = Math.random() + 0.5;
			sound.rate(random_rate, id);
		};
		SPACE.release = function () { /* no op */ };
		//

		gameState = gamePlay;
	}
}

function gameDormant () {
	renderer.view.hidden = true;
	// splash_header.textContent = "";
	logo_img.style.display = 'block';
	anykey_subhead.textContent = "HIT ANY KEY";
}

function gamePlay () {

	hitTestAll();
	player.tick();
	evil_otto.tick();
	updateRobots();
	updateBullets();
	updateGameUI(); // score, etc ... including debug stuff – in layout.js
}

function prepareToExitLevel (side) {

	maze.children.forEach( function (child) {
		child.tint = 0x0000FF;
	});

	x_vel = 0;
	y_vel = 0;
	var rate = 5;
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
		soundsInSequence('chicken fight like a robot'.split(' '));
	} else {
		soundsInSequence('the humanoid must not escape'.split(' '));
	}
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

function gameOver () {

	if (timer > game_over_timer) {
		gameState = resetGameState;
	} else {
		renderer.view.hidden = true;
		// splash_header.textContent = "GAME OVER";
	}
}

/*******************************************************************************
 * bullets
 *******************************************************************************/
function fire (sprite) {

	var shot = getBullet(sprite);
	maze.addChild(shot);

	if (sprite === player) {
		bullets.push(shot);
		sound.play('player_bullet');
	} else {
		robot_bullets.push(shot);
		sound.play('robot_bullet');
	}
}

function updateBullets () {

	for (var i = 0, s_len = bullets.length; i < s_len; i++) {
		bullets[i].tick();
	}
	for (var i = 0, s_len = robot_bullets.length; i < s_len; i++) {
		robot_bullets[i].tick();
	}
}

function removeBullet(shot) {

	var arr = (shot.sprite.name === player.name) ? bullets : robot_bullets;
	maze.removeChild(shot);
	arr.splice(arr.indexOf(shot), 1);
	shot.destroy();
}

/*******************************************************************************
 * robots
 *******************************************************************************/
function getRobots () {

	var robots = [];
	var max_num_robots = 9, min_num_robots = 3;
	var num_robots = Math.floor(Math.random() * max_num_robots) + min_num_robots;
	var possible_positions = getPossiblePositions();
	var robot, robot_pos;

	for (var r = 0; r < num_robots; r++) {

		robot = getRobot();

		random_index = Math.floor(Math.random() * possible_positions.length);
		robot_pos = possible_positions.splice(random_index, 1)[0];
		robot_pos.x += Math.floor(Math.random() * 50) - 25;
		robot_pos.y += Math.floor(Math.random() * 50) - 25;
		robot.position.set(robot_pos.x, robot_pos.y);
		robot.index = r;

		robots.push(robot);
	}
	return robots;
}

function updateRobots () {

	for (var i = 0, r_len = robots.length; i < r_len; i++) {
		robots[i].tick();
	}
}

function removeRobot (sprite) {

	maze.removeChild(sprite);
	robots.splice(robots.indexOf(sprite), 1);
	sprite.destroy();
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
	if (score >= score_tiers[8]) { col = Math.floor(Math.random() * 0xFFFFFF);  } // MAX
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


