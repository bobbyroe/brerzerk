
// Aliases
var Rectangle = PIXI.Rectangle;
var Container = PIXI.Container;
var autoDetectRenderer = PIXI.autoDetectRenderer;
var loader = PIXI.loader;
var resources = PIXI.loader.resources;
var Sprite = PIXI.Sprite;
var Grfx = PIXI.Graphics;
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
// https://github.com/kittykatattack/learningPixi#pixis-graphic-primitives

/*******************************************************************************
 * Setup
 *******************************************************************************/
var player_sprite;
var gameState;
var timer = 0;
var num_players_remaining = 2;
var colors8 = [0xFFFFFF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFF0000, 0x00FF00];
var walls = [];
var robots = [];
var DEBUG = false;
var bullets = [];
var max_bullets = 2;
var max_robot_bullets = 1;
var robot_bullets = [];
var listeners = [];

var renderer = autoDetectRenderer(
	1024, 768, 
	{antialias: false, transparent: false, resolution: 1}
);
document.body.appendChild(renderer.view);

var debug_timer = document.createElement('div');
debug_timer.style = "position:absolute; top:30px;left:50px;color:#FFFFFF";
document.body.appendChild(debug_timer);

var stage = new Container();
renderer.render(stage);

loader
	.add("images/robot.png")
	.add("images/robot-explode.png")
	.add("images/player.png")
	.load(setup);

// audio
var sound = new Howl({
	src: ['audio/sound_sprite.mp3'],
	sprite: {
		humanoid: [0, 650],
		player_bullet: [700, 1000],
		player_dead: [1750, 2500],
		robot_bullet: [4330, 750],
		robot_dead: [5130, 800],
		robot: [6010, 580]
	}
});

function setup() {

	timer = 0;

	player_sprite = getPlayer();
	stage.addChild(player_sprite);
	drawWalls();
	// Start the game loop
	gameState = gameStart;
	gameLoop();
}

/*******************************************************************************
 * GAME PLAY LOOP
 *******************************************************************************/
function gameLoop() {

	requestAnimationFrame(gameLoop);
	timer += 1;
	if (DEBUG === true) { debug_timer.textContent = timer; }
	gameState();

	renderer.render(stage);
}

function gameStart () {

	if (timer < player_sprite.blinking_duration) {
		player_sprite.visible = (timer % 40 > 20);
	} else {
		player_sprite.visible = true;
		robots = getRobots();
		for (var r = 0, r_len = robots.length; r < r_len; r++) {
			stage.addChild(robots[r]);
		}
		gameState = gamePlay;
	}
}

function gameRestarting () {
	// clean up
	stage.removeChildren();
	walls = [];
	robots = [];
	removeListeners();

	timer = 0;
	player_sprite = getPlayer();
	stage.addChild(player_sprite);
	drawWalls();
	gameState = gameStart;

	console.log(num_players_remaining);
}


function gamePlay () {

	hitTestAll();
	player_sprite.tick();
	updateRobots();
	updateBullets();
}

function gameOver () {

	stage.removeChildren();
	console.log("GAME OVER");
}

/*******************************************************************************
 * bullets
 *******************************************************************************/
function fire (sprite) {
	
	var shot = getBullet(sprite);
	stage.addChild(shot);
	bullets.push(shot);

	sound.play('player_bullet');
}

function updateBullets () {

	for (var i = 0, s_len = bullets.length; i < s_len; i++) {
		bullets[i].tick();
	}
}

function removeBullet(shot) {

	stage.removeChild(shot);
	bullets.splice(bullets.indexOf(shot), 1);
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
		robot.setPosition(robot_pos);
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
	stage.removeChild(sprite);
	robots.splice(robots.indexOf(sprite), 1);
	sprite.destroy();
}
