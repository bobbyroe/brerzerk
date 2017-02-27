'use strict';

/**
// 
**/
class Events {

    constructor (context) {
        
        this.context = context;
        this.listeners = {};
    }

    listenTo (target, evt_name, callback, opt_context) {

        var scope = opt_context ? opt_context : this.context;
        var new_listener = {
            target: target,
            callback: callback,
            context: scope
        };

        if (this.listeners[evt_name]) {
            this.listeners[evt_name].push(new_listener);
        } else {
            this.listeners[evt_name] = [new_listener];
        }
    }
    stopListening (target, evt_name, callback) {

        var listener;
        var listeners = this.listeners[evt_name];
        var leftovers = [];

        if (listeners) {
            for (var i = 0, len = listeners.length; i < len; i++) {
                listener = listeners[i];
                if (listener.target !== target && listener.callback !== callback) {
                    leftovers.push(listener);
                }
            }
            this.listeners[evt_name] = leftovers;
        }
    }
    isListening (target, evt_name, callback) {

        var listeners = this.listeners[evt_name];
        var confirmed = [];
        if (listeners) {
            confirmed = listeners.filter( (item) =>
                (item.target === target && item.callback === callback)
            );
            return confirmed !== [];
        }
    }
    dispatch (evt_name, caller, params) {

        var listener;
        var args = Array.prototype.slice.call(arguments, 1);
        var listeners = this.listeners[evt_name];
        var doCallback = listener => listener.callback.apply(listener.context, args);
            
        if (listeners) {
            for (var i = 0, len = listeners.length; i < len; i++) {
                listener = listeners[i];
                if (listener.target === caller) {
                    doCallback(listener);
                }
            }
        }
    }
}

/*******************************************************************************
 * keyboard.js
 *******************************************************************************/

var listeners = [];
function listen (code) {

	var key = {
		code: code,
		isDown: false,
		isUp: true,
		press: null,
		release: null,
		shiftKey: false
	};

	key.downHandler = function (evt) {

		if (evt.code === key.code) {
			key.shiftKey = evt.shiftKey;
			if (key.isUp && key.press) { key.press(); }
			key.isDown = true;
			key.isUp = false;
		}
		evt.preventDefault();
	};

	key.upHandler = function(evt) {
		if (evt.code === key.code) {
			key.shiftKey = evt.shiftKey;
			if (key.isDown && key.release) { key.release(); }
			key.isDown = false;
			key.isUp = true;
		}
		evt.preventDefault();
	};

	var dnFn = key.downHandler.bind(key);
	var upFn = key.upHandler.bind(key);
	listeners.push({
		down: { type: 'keydown', fn: dnFn },
		up: { type: 'keyup', fn: upFn }
	});
	
	return key;
}

function removeListeners () {
	listeners = [];
}

// one set of listeners for all!
function onKeyDown (evt) {

	for (var l = 0, len = listeners.length; l < len; l++) {
		listeners[l].down.fn(evt);
	}
}

function onKeyUp (evt) {

	for (var l = 0, len = listeners.length; l < len; l++) {
		listeners[l].up.fn(evt);
	}
}


/*******************************************************************************
 * misc testing 
 *******************************************************************************/
//
// play a random robot speach bit ?
//
function addTestKey (options_obj) {

	var { pubSub, game } = options_obj;
	var SPACE = listen('Space');
	SPACE.press = function () { 
		// var snds = Object.keys(talking_audio);
		// var id = _sound.play(snds[Math.floor(Math.random() * snds.length)]); 
		// var random_rate = Math.random() + 0.5;
		// _sound.rate(random_rate, id);
		pubSub.dispatch('TESTING', game);
	};
	SPACE.release = function () { /* no op */ };
}

window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

var keyboard = { listen, removeListeners, addTestKey };

/*******************************************************************************
 * HIT TESTING!
 *******************************************************************************/
 function hitTestAll (all_sprites) {


	// unpack
	var { player, walls, robots, robot_bullets, bullets, evil_otto } = all_sprites;

	// check every wall
	for (var a = 0, a_len = walls.length; a < a_len; a++) {
		var cur_wall = walls[a];

		// player
		if (_hitTestRectangle(player, cur_wall) ) {
			player.was_hit = true;
		}
		
		// all robots
		for (var b = 0, b_len = robots.length; b < b_len; b++) {
			if (_hitTestRectangle(cur_wall, robots[b]) ) {
				robots[b].was_hit = true;
			}
		}

		// robot bullets
		for (var c = 0, c_len = robot_bullets.length; c < c_len; c++) {
			if (_hitTestRectangle(cur_wall, robot_bullets[c]) ) {
				robot_bullets[c].was_hit = true;
			}
		}

		// player bullets
		for (var d = 0, d_len = bullets.length; d < d_len; d++) {
			if (_hitTestRectangle(cur_wall, bullets[d]) ) {
				bullets[d].was_hit = true;
			}
		}
	}

	// check every robot
	for (var e = 0, e_len = robots.length; e < e_len; e++) {

		var cur_robot = robots[e];
		// player
		if (_hitTestRectangle(player, cur_robot) ) {
			player.was_hit = true;
			cur_robot.was_hit = true;
			break;
		}

		// evil otto
		if (_hitTestRectangle(evil_otto, cur_robot) ) {
			cur_robot.was_hit = true;
		}

		// all robots
		for (var f = 0, f_len = robots.length; f < f_len; f++) {
			if (robots[f] !== cur_robot) {
				if (_hitTestRectangle(cur_robot, robots[f]) ) {
					cur_robot.was_hit = true;
					robots[f].was_hit = true;
				}
			}
		}

		// robot bullets
		for (var g = 0, g_len = robot_bullets.length; g < g_len; g++) {
			if (robot_bullets[g].sprite !== cur_robot) {
				if (_hitTestRectangle(cur_robot, robot_bullets[g]) ) {
					cur_robot.was_hit = true;
					robot_bullets[g].was_hit = true;
				}
			}
		}

		// player bullets
		for (var h = 0, h_len = bullets.length; h < h_len; h++) {
			if (_hitTestRectangle(cur_robot, bullets[h]) ) {
				cur_robot.was_hit = true;
				bullets[h].was_hit = true;
			}
		}
	}

	// robot bullets
	for (var i = 0, i_len = robot_bullets.length; i < i_len; i++) {
		var cur_robot_bullet = robot_bullets[i];
		
		// player
		if (_hitTestRectangle(player, cur_robot_bullet) ) {
			player.was_hit = true;
			cur_robot_bullet.was_hit = true;
			break;
		}

		// other robot bullets
		for (var j = 0, j_len = robot_bullets.length; j < j_len; j++) {
			if (robot_bullets[j] !== cur_robot_bullet) {
				if (_hitTestRectangle(robot_bullets[j], cur_robot_bullet) ) {
					cur_robot_bullet.was_hit = true;
					robot_bullets[j].was_hit = true;
				}
			}
		}

		// player bullets
		for (var k = 0, k_len = bullets.length; k < k_len; k++) {
			if (_hitTestRectangle(bullets[k], cur_robot_bullet) ) {
				cur_robot_bullet.was_hit = true;
				bullets[k].was_hit = true;
			}
		}
	}
	if (_hitTestRectangle(player, evil_otto) ) {
		player.was_hit = true;
	}
}

function _hitTestRectangle(r1, r2) {

	var hit = false;
	var combinedHalfWidths;
	var combinedHalfHeights;
	var vx;
	var vy;
	var fudge_factor = 2;

	r1.centerX = r1.x + r1.width * 0.5;
	r1.centerY = r1.y + r1.height * 0.5;
	r2.centerX = r2.x + r2.width * 0.5;
	r2.centerY = r2.y + r2.height * 0.5;

	r1.halfWidth = r1.width * 0.5 - fudge_factor;
	r1.halfHeight = r1.height * 0.5 - fudge_factor;
	r2.halfWidth = r2.width * 0.5 - fudge_factor;
	r2.halfHeight = r2.height * 0.5 - fudge_factor;

	vx = r1.centerX - r2.centerX;
	vy = r1.centerY - r2.centerY;

	combinedHalfWidths = r1.halfWidth + r2.halfWidth;
	combinedHalfHeights = r1.halfHeight + r2.halfHeight;

	//Check for a collision on the x axis
	if (Math.abs(vx) < combinedHalfWidths) {
		if (Math.abs(vy) < combinedHalfHeights) {
			hit = true;
		} else {
			hit = false;
		}
	} else {
		hit = false;
	}
	return hit;
}

function getOutOfBoundsSide (obj, game) {

	var maze_width = 10 + game.quad_width * 5;
	var maze_height = 10 + game.quad_height * 3;
	var side = (obj.x < 0) ? 'left' :
		(obj.x + obj.width > maze_width + 25) ? 'right' : // add 25px fudge
		(obj.y < 0) ? 'top' :
		(obj.y + obj.height > maze_height + 25) ? 'bottom' : // add 25px fudge
		'none';
	return side;
}


/*******************************************************************************
 * UTILS!
 *******************************************************************************/
function degToRad (deg) {

	return deg * Math.PI / 180;
}

var getBullet = (function () {

	return function (sprite, game) {

		var direction = `${Math.abs(sprite.ax)}${Math.abs(sprite.ay)}`;
		var rotation = (sprite.ax + sprite.ay === 0) ? -45 : 45;
		var len = sprite.bullet_length;
		var shot = new PIXI.Graphics();
		shot.beginFill(sprite.bullet_color);
		var id = 0; // debug 

		switch (direction) {
			case '01': 
			shot.drawRect(0, 0, 1, len);
			break;
			case '10': 
			shot.drawRect(0, 0, len, 1);
			break;
			case '11': 
			shot.drawRect(0, 0, len, 1);
			shot.rotation = degToRad(rotation);
			break;
		}
		shot.endFill();

		shot.x = sprite.x + 8;
		shot.y = sprite.y + 20;
		shot.scale.set(4, 4);
		shot.vx = sprite.ax * sprite.bullet_velocity;
		shot.vy = sprite.ay * sprite.bullet_velocity;
		shot.sprite = sprite;
		shot.name = `${sprite.name} bullet${id}`; // debug
		shot.tick = _updateBullet;


		function _updateBullet () {
			if (shot.was_hit === true) {
				setTimeout(_removeBullet, 1, shot);
			} else {
				shot.x += shot.vx;
				shot.y += shot.vy;
				// bounds
				if (getOutOfBoundsSide(shot, game) !== 'none') {
					setTimeout(_removeBullet, 1);
				}
			}
		}

		function _removeBullet () {

			var arr = shot.sprite.bullets;
			if (shot.parent != null) { shot.parent.removeChild(shot); }
			arr.splice(arr.indexOf(shot), 1);
			shot.destroy();
		}

		return shot;
	};

})();

var getPlayer = (function () {

	var colors8 = [0xFFFFFF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFF0000, 0x00FF00];

	return function (options_obj) {

		// unpack
		var { start_pos, bullets, game, sound, pubSub } = options_obj;

		var player_tex = PIXI.loader.resources["images/player.png"].texture.clone();
		var player_sprite = new PIXI.Sprite(player_tex);
		var rect = new PIXI.Rectangle(0, 0, 8, 17);
		player_tex.frame = rect;
		player_sprite.scale.set(4, 4);
		player_sprite.tint = 0x00FF00;
		player_sprite.x = start_pos.x; // 150;
		player_sprite.y = start_pos.y; // 90;
		player_sprite.name = 'humanoid';
		
		player_sprite.vx = 0;
		player_sprite.vy = 0;
		player_sprite.ax = 0; // aim.x
		player_sprite.ay = 0; // aim.y
		player_sprite.was_hit = false;
		player_sprite.ctrl_keys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
		player_sprite.rate = 2;
		player_sprite.death_anim_duration = 80;
		player_sprite.death_start_timer = -1;
		player_sprite.blinking_duration = (game.is_restarting === true) ? 120 : 10;
		player_sprite.bullet_delay = 30;

		player_sprite.bullets = bullets;
		player_sprite.max_bullets = 2;
		player_sprite.bullet_velocity = 8;
		player_sprite.bullet_length = 8;
		player_sprite.bullet_color = 0x00FF00;

		// CHEAT
		player_sprite.is_invincible = true;

		// public methods
		player_sprite.tick = playerPending;

		setUpCtrlsFor(player_sprite);
		function setUpCtrlsFor (sprite) {

			var moveUp = keyboard.listen(sprite.ctrl_keys[0]);
			var moveRight = keyboard.listen(sprite.ctrl_keys[1]);
			var moveDown = keyboard.listen(sprite.ctrl_keys[2]);
			var moveLeft = keyboard.listen(sprite.ctrl_keys[3]);

			moveLeft.press = function () {
				if (moveLeft.shiftKey === true) {
					sprite.ax = -1;
					tryToShoot(sprite);
				} else {
					sprite.vx = sprite.rate * -1;
				}
			};

			moveLeft.release = function () {
				if (moveRight.isDown === false) {
					sprite.ax = 0;
					sprite.vx = 0;
				}
			};

			moveRight.press = function () {
				if (moveRight.shiftKey === true) {
					sprite.ax = 1;
					tryToShoot(sprite);
				} else {
					sprite.vx = sprite.rate;
				}
			};

			moveRight.release = function () {
				if (moveLeft.isDown === false) {
					sprite.ax = 0;
					sprite.vx = 0;
				}
			};

			moveUp.press = function () {
				if (moveUp.shiftKey === true) {
					sprite.ay = -1;
					tryToShoot(sprite);
				} else {
					sprite.vy = sprite.rate * -1;
				}
			};

			moveUp.release = function () {
				if (moveDown.isDown === false) {
					sprite.ay = 0;
					sprite.vy = 0;
				}
			};

			moveDown.press = function () {
				if (moveDown.shiftKey === true) {
					sprite.ay = 1;
					tryToShoot(sprite);
				} else {
					sprite.vy = sprite.rate;
				}
			};

			moveDown.release = function () {
				if (moveUp.isDown === false) {
					sprite.ay = 0;
					sprite.vy = 0;
				}
			};
		}

		function tryToShoot (sprite) {
			if (player_sprite.tick === playerPlay &&
				game.timer >= sprite.bullet_delay &&
				bullets.length < sprite.max_bullets) {

				pubSub.dispatch('shot_fired', game, sprite);
			}
		}

		function getTexFrameFor (sprite) {

			var rect = new PIXI.Rectangle(0, 0, 8, 17);

			if (sprite.vx > 0 || sprite.vy !== 0) {
				rect = new PIXI.Rectangle( (Math.round(game.timer * 0.4) % 3) * 8 + 8, 0, 8, 17);
			}

			if (sprite.vx < 0) {
				rect = new PIXI.Rectangle( (Math.round(game.timer * 0.4) % 3) * 8 + 40, 0, 8, 17);
			}
			return rect;
		}

		// PLAYER STATES
		function playerPending () {

			// blink player location
			if (game.timer < player_sprite.blinking_duration) {
				player_sprite.visible = (game.timer % 40 > 20);
			} else {
				player_sprite.visible = true;
				player_sprite.tick = playerPlay;
			}
		}

		function playerPlay () {

			var exit_side = getOutOfBoundsSide(player_sprite, game);
			if (exit_side !== 'none') {
				// prepareToExitLevel(exit_side);
				pubSub.dispatch('player_exiting_maze', game, exit_side);
			}

			if (player_sprite.was_hit === true && player_sprite.is_invincible === false) {

				player_sprite.death_start_timer = game.timer;
				player_sprite.tick = playerDead;
				sound.play('player_dead');		
			} else {
				player_sprite.x += player_sprite.vx;
				player_sprite.y += player_sprite.vy;
				// animate him
				player_sprite.texture.frame = getTexFrameFor(player_sprite);
			}
		}

		function playerDead () {

			if (game.timer - player_sprite.death_start_timer < player_sprite.death_anim_duration) {
				// player death
				player_sprite.texture.frame = new PIXI.Rectangle((Math.round(game.timer * 0.4) % 4) * 8 + 80, 0, 8, 17);
				player_sprite.tint = colors8[Math.floor(Math.random() * colors8.length)];
			} else {
				player_sprite.tint = 0x000000;
				pubSub.dispatch('got_the_humanoid', game);
			}
		}
		return player_sprite;
	};
})();

var getRobot = (function () {

	var robot_score = 50;
	var robots_awake_time = 150;

	return function (options_obj) {

		// unpack
		var { max_num_robots, robots, robot_bullets, walls, maze, game, sound, pubSub } = options_obj;

		var robot_tex = PIXI.loader.resources["images/robot.png"].texture.clone();
		var robot_sprite = new PIXI.Sprite(robot_tex);

		var robot_explode_tex = PIXI.loader.resources["images/robot-explode.png"].texture.clone();
		var rect = new PIXI.Rectangle(0, 0, 8, 11);
		robot_tex.frame = rect;
		robot_sprite.vx = 0;
		robot_sprite.vy = 0;
		robot_sprite.scale.set(4, 4);
		robot_sprite.rate = 0;
		robot_sprite.explode_tex = robot_explode_tex;
		robot_sprite.explode_tex.num_frames = 3;
		robot_sprite.tint = game.enemy_color;
		robot_sprite.death_start_timer = -1;
		robot_sprite.timer_offset = Math.floor(Math.random() * 100);
		robot_sprite.index = -1;
		robot_sprite.name = `robot${game.timer}`;

		robot_sprite.bullets = robot_bullets;
		robot_sprite.bullet_velocity = getRobotBulletVelocity();
		robot_sprite.bullet_length = 6;
		robot_sprite.bullet_color = game.enemy_color;
		robot_sprite.was_hit = false;
		robot_sprite.qx = -1;
		robot_sprite.qy = -1;

		// public methods
		robot_sprite.tick = robotPlay;
		
		// animation vars
		robot_sprite.frame_delay = 0.25; // smaller == slower

		// ROBOT STATES
		function robotDead () {

			var frame_num = (Math.floor((game.timer - robot_sprite.death_start_timer) * 0.1) % 4);		
			if (frame_num < robot_sprite.explode_tex.num_frames) {
				robot_sprite.texture = robot_sprite.explode_tex;
				robot_sprite.anchor.x = 0.28;
				robot_sprite.anchor.y = 0.28;
				robot_sprite.texture.frame = new PIXI.Rectangle( frame_num * 18, 0, 18, 18);
			} else {

				setTimeout(_removeRobot, 1, robot_sprite);
			}
		}

		var delay_coefficient = 1 / max_num_robots;
		function robotPlay (player_sprite) {

			robot_sprite.frame_delay = 0.25 * (1 - (robots.length * delay_coefficient)); // 2 / 12 (1 / max num robots)

			var anim_frame_index = (Math.round(game.timer * robot_sprite.frame_delay) % 2) * 8;
			var standing_frame_index = (Math.round( (game.timer + robot_sprite.timer_offset) * robot_sprite.frame_delay) % 6) * 8;
			var robots_left = -1;
			if (robot_sprite.was_hit === true) {
				
				robot_sprite.death_start_timer = game.timer;
				sound.play('robot_dead');
				game.score += robot_score;

				// if all robots have been killed, award bonus
				robots_left = robots.filter( r => (r.was_hit === false)).length;
				if (robots_left === 0) {
					pubSub.dispatch('all_robots_killed', game);
				}

				robot_sprite.tick = robotDead;
			} else {

				if (game.timer < robots_awake_time === false) {
					targetThe(player_sprite);
				}

				robot_sprite.x += robot_sprite.vx;
				robot_sprite.y += robot_sprite.vy;

				// animate him
				if (robot_sprite.vy > 0) {
					robot_sprite.texture.frame = new PIXI.Rectangle(anim_frame_index + 64, 0, 8, 11);
				} else if (robot_sprite.vy < 0) {
					robot_sprite.texture.frame = new PIXI.Rectangle(anim_frame_index + 96, 0, 8, 11);
				}

				if (robot_sprite.vx > 0) {
					robot_sprite.texture.frame = new PIXI.Rectangle(anim_frame_index + 48, 0, 8, 11);
				} else if (robot_sprite.vx < 0) {
					robot_sprite.texture.frame = new PIXI.Rectangle(anim_frame_index + 80, 0, 8, 11);
				}

				if (robot_sprite.vx === 0 && robot_sprite.vy === 0) {
					robot_sprite.texture.frame = new PIXI.Rectangle(standing_frame_index, 0, 8, 11);
				}
			}
		}

		function targetThe (player_sprite) {

			robot_sprite.rate = 2 - (robots.length * 0.16); // 2 / 12 (max speed / max num robots)

			robot_sprite.ax = (robot_sprite.x - player_sprite.x > 1) ? -1 : 1;
			robot_sprite.ay = (robot_sprite.y - player_sprite.y > 1) ? -1 : 1;

			if (Math.abs(robot_sprite.x - player_sprite.x) < 20) { robot_sprite.ax = 0; }
			if (Math.abs(robot_sprite.y - player_sprite.y) < 20) { robot_sprite.ay = 0; }

			// update robot velocity
			robot_sprite.vx = robot_sprite.ax * robot_sprite.rate;
			robot_sprite.vy = robot_sprite.ay * robot_sprite.rate;
			
			var nearby_walls = _getNearbyWalls(robot_sprite);
			if (nearby_walls.top === true) {
				robot_sprite.vy = Math.max(robot_sprite.vy, 0);
			}
			if (nearby_walls.right === true) {
				robot_sprite.vx = Math.min(robot_sprite.vx, 0);
			}
			if (nearby_walls.bottom === true) {
				robot_sprite.vy = Math.min(robot_sprite.vy, 0);
			}
			if (nearby_walls.left === true) {
				robot_sprite.vx = Math.max(robot_sprite.vx, 0);
			}
		
			if (game.timer >= game.next_robot_bullet_time && robot_sprite.bullets.length < game.max_robot_bullets) {

				if (Math.abs(robot_sprite.x - player_sprite.x) < 20 ||
					Math.abs(robot_sprite.y - player_sprite.y) < 20 ||
					Math.abs((robot_sprite.x - robot_sprite.y) - (player_sprite.x - player_sprite.y)) < 20 ||
					Math.abs((robot_sprite.x - player_sprite.y) - (player_sprite.x - robot_sprite.y)) < 20) {
					
						pubSub.dispatch("shot_fired", game, robot_sprite);
				}	
			}
		}

		// 
		function getRobotBulletVelocity () {

			var vel = (game.score < 7500) ? 4 : 8;
			return vel;
		}

		function _getNearbyWalls (sprite) {

			var top = false;
			var right = false;
			var bottom = false;
			var left = false;
			sprite.qx = Math.floor(sprite.x / game.quad_width);
			sprite.qy = Math.floor(sprite.y / game.quad_height);

			// annotate this one please 
			var re = new RegExp(`${sprite.qx}${sprite.qy}\\d`);
			
			walls.forEach( function (w) {
				top = top 		 || w.name === `${sprite.qx}${sprite.qy - 1}2`;
				right = right 	 || w.name === `${sprite.qx + 1}${sprite.qy}3`;
				bottom 	= bottom || w.name === `${sprite.qx}${sprite.qy + 1}0`;
				left = left 	 || w.name === `${sprite.qx - 1}${sprite.qy}1`;
			});

			var quad_walls = walls.filter( function (w) { return re.test(w.name); });
			
			quad_walls.forEach( function (w) {
				top = top 		 || w.name[2] === '0';
				right = right 	 || w.name[2] === '1';
				bottom 	= bottom || w.name[2] === '2';
				left = left  	 || w.name[2] === '3';
			});

			return {
				top: top,
				right: right,
				bottom: bottom,
				left: left,
			};
		}

		function _removeRobot (sprite) {

			maze.removeChild(sprite);
			robots.splice(robots.indexOf(sprite), 1);
			sprite.destroy();
		}

		return robot_sprite;
	};
})();

/**
 *
 * PIXI globals: Sprite
 *
 **/

function getEvilOtto (options_obj) {

	// unpack
	var { pos, player, robots, start_pos, maze, sound, game } = options_obj;
	
	var otto_tex = PIXI.loader.resources["images/evil-otto.png"].texture;
	var otto_sprite = new PIXI.Sprite(otto_tex);
	var rect = new PIXI.Rectangle(44, 0, 11, 43);
	otto_tex.frame = rect;
	otto_sprite.vx = 0;
	otto_sprite.vy = 0;
	otto_sprite.ax = 0; // aim.x
	otto_sprite.ay = 0; // aim.y
	otto_sprite.scale.set(4, 4);
	otto_sprite.rate = 2;
	otto_sprite.tint = game.enemy_color;
	otto_sprite.x = pos.x; // 150;
	otto_sprite.y = pos.y; // 90;
	otto_sprite.target = player;
	otto_sprite.name = 'EVIL OTTO';
	otto_sprite.rate = 0.5;
	otto_sprite.delay_timer = 100000; // default
	
	// public methods
	otto_sprite.tick = ottoDormant;

	var otto_frame_indices = [6, 7, 8, 9, 10, 11, 12, 11, 10, 9, 8, 7];
	var o_len = otto_frame_indices.length - 1;
	function ottoPlay () {

		var target = otto_sprite.target;
		
		// direction = target position - object position
	    var dx = target.x - otto_sprite.x;
	    var dy = target.y - otto_sprite.y;
	    var angle = Math.atan2(dy, dx);
	    otto_sprite.rate = 2 - (robots.length * 0.16); // 2 / 12 (max speed / max num robots)

	    otto_sprite.vx = Math.cos(angle) * otto_sprite.rate;
	    otto_sprite.vy = Math.sin(angle) * otto_sprite.rate;
	    
		otto_sprite.x += otto_sprite.vx;
		otto_sprite.y += otto_sprite.vy;

		// animate him
		var x_frame = otto_frame_indices[(Math.round(game.timer * (otto_sprite.rate * 0.4)) % o_len)] * 11; 
		otto_sprite.texture.frame = new PIXI.Rectangle( x_frame, 0, 11, 43);
		
	}

	function ottoDormant () {

		if (game.timer > otto_sprite.delay_timer) {
			sound.inSequence('INTRUDER ALERT INTRUDER ALERT'.split(' '));
			maze.addChild(otto_sprite);
			otto_sprite.tick = ottoStart;
			otto_sprite.position.set(start_pos.x, start_pos.y);
		}
	}

	function ottoStart () {

		var x_pos = (Math.round((game.timer - otto_sprite.delay_timer) * 0.1) % 8) * 11; 

		if (x_pos > 66) {
			otto_sprite.tick = ottoPlay;
		} else {
			// animate him
			otto_sprite.texture.frame = new PIXI.Rectangle(x_pos, 0, 11, 43);
		}
		
	}

	return otto_sprite;
}

function drawWalls (options_obj) {
	
	// unpack
	let { walls, maze, start_pos, game } = options_obj;
	let num_cols = 5;
	let num_rows = 3;
	let width = 15;
	let color = 0x0000FF;
	//
	var x_pos = 5;
	var y_pos = 10;
	var sides = "top,right,bottom,left".split(',');
	var random_sides = [];
	var random_prob = 0.2;
	var a_random_side = '';
	var player_start = {
		col: Math.floor(start_pos.x / game.quad_width),
		row: Math.floor(start_pos.y / game.quad_height)
	};
	var blocker_side = '';
	var remaining_sides = [];

	for (var row = 0; row < num_rows; row ++) {

		x_pos = 5;

		for (var col = 0; col < num_cols; col++) {
			random_sides = [];

			if (Math.random() < random_prob) {
				a_random_side = sides[Math.floor(Math.random() * sides.length)];
				random_sides.push(a_random_side);

				remaining_sides = sides.filter( function (s) {
					return random_sides.indexOf(s) === -1;
				});
				random_sides.push(remaining_sides[Math.floor(Math.random() * remaining_sides.length)]);
			}

			if (game.is_restarting === false) {
				// draw exit blocker
				if (player_start.row === 0 && player_start.col === 2) { blocker_side = 'top'; }
				if (player_start.row === 1 && player_start.col === num_cols - 1) { blocker_side = 'right'; }
				if (player_start.row === num_rows - 1 && player_start.col === 2) { blocker_side = 'bottom'; }
				if (player_start.row === 1 && player_start.col === 0) { blocker_side = 'left'; }

				if (row === player_start.row && col === player_start.col) {
					color = game.enemy_color;
					width = 8;
					random_sides = [ blocker_side ];
				} else {
					color = 0x0000FF;
					width = 15;
				}
			}

			// random_sides.forEach(_addSide);
			x_pos += game.quad_width;
		}
		y_pos += game.quad_height;
	}


	//
	var game_tiles;
	let exit_id = 2;
	let _needs_redo = false;
	let _numTriesToCreateMaze = 1;
	function _initMazeCreation () {
		game_tiles = getGameTiles();
		let start_ids = [5, 9, 12];

		start_ids.forEach( id => {

			let start_tile = game_tiles.find( t => t.id === id);
			_findPathToExit(start_tile, id);
		});

		if (_needs_redo === true) {
			_needs_redo = false;
			_numTriesToCreateMaze += 1;
			_initMazeCreation();
		} 
	}

	_initMazeCreation();

	function _findPathToExit (tile, start_id) {

		if (tile.was_visited === true) {

			// console.log("already good to go! ->", tile.id);
			if (_needs_redo === false && tile.id === 12) {
				// console.log("********************************");
				console.log(`It took ${_numTriesToCreateMaze} tries to create this maze`);
			}

		} else {

			tile.was_visited = true;
			let next_tile = _getNextTileFrom(tile.adjacent_tiles, game_tiles);

			// are we an exit tile?
			if (tile.id !== start_id && tile.id === exit_id) {

				// we're done!
				// console.log("found it! ->", exit_id);

				// draw last of the internal walls ...
				tile.adjacent_tiles.forEach( t => {

					let side = -1;
					if (t === tile.id - num_cols) { side = 0; }
					if (t === tile.id + 1) { side = 1; }
					if (t === tile.id + num_cols) { side = 2; }
					if (t === tile.id - 1) { side = 3; }

					// only push the "wall" if it's an elidible interior side
					if (tile.interior_walls.indexOf(side) !== -1) { tile.walls.push(side); }
				});

			} else if (next_tile == null || tile.adjacent_tiles.length === 0) { 

				// console.log("on no, you need to start over!!!", tile, `(${start_id})`);

				// flag this sumbitch as broke, and in need of redos
				_needs_redo = true;

			} else {

				// add walls on remaining sides 
				let remaining_tiles = tile.adjacent_tiles.filter( t => t !== next_tile.id );
				remaining_tiles.forEach( t => {

					let side = -1;
					if (t === tile.id - num_cols) { side = 0; }
					if (t === tile.id + 1) { side = 1; }
					if (t === tile.id + num_cols) { side = 2; }
					if (t === tile.id - 1) { side = 3; }

					// only push the "wall" if it's an elidible interior side
					if (tile.interior_walls.indexOf(side) !== -1) { tile.walls.push(side); }
				});
				// remove the current tile from the list of adjacent tiles
				let i = next_tile.adjacent_tiles.indexOf(tile.id);
				if (i !== -1) { next_tile.adjacent_tiles.splice(i, 1); }

				if (next_tile.was_visited === true) {
					// break down the wall if need be
					// ... in the /next/ tile
					let other_side = -1;
					if (next_tile.id === tile.id - num_cols) { other_side = 2; }
					if (next_tile.id === tile.id + 1) { other_side = 3; }
					if (next_tile.id === tile.id + num_cols) { other_side = 0; }
					if (next_tile.id === tile.id - 1) { other_side = 2; }

					let other_index = next_tile.walls.indexOf(other_side);
					if (other_index !== -1) { next_tile.walls.splice(other_index, 1); }
				}
				// recurse
				// console.log("--->", tile);
				_findPathToExit(next_tile, start_id, exit_id);
			}
		}
	}

	// DEBUG draw path boxes
	game_tiles.forEach( t => {

		if (t.was_visited === false) {
			// stoke the walls array with the interior walls too
			t.interior_walls.forEach( n => {
				t.walls.push(n);
			});
		}
	});

	game_tiles.forEach( t => {

		// let column = t.id % num_cols;
		// let cur_row = Math.floor(t.id / num_cols);
		// let pos = {
		// 	x: 5 + column * game.quad_width,
		// 	y: 10 + cur_row * game.quad_height
		// };
		// let square = null;

		if (t.was_visited === false) {

			let visited_tiles = t.adjacent_tiles.filter( id => game_tiles.find( t => t.id === id).was_visited === true );
			let random_index = Math.floor(Math.random() * visited_tiles.length);
			let random_id = visited_tiles[random_index];
			let side = -1;
			if (random_id === t.id - num_cols) { side = 0; }
			if (random_id === t.id + 1) { side = 1; }
			if (random_id === t.id + num_cols) { side = 2; }
			if (random_id === t.id - 1) { side = 3; }

			// if the current tile has this wall ...
			let index = t.walls.indexOf(side);
			if (index !== -1) {

				t.walls.splice(index, 1);
				console.log(t.id, "-->", random_id, `(${side})`);
			} else {

				let other_tile = game_tiles.find( t => t.id === random_id);
				// "transpose" the side 
				let other_side = side < 2 ? side + 2 : side - 2;

				var other_index = other_tile.walls.indexOf(other_side);
				if (other_index !== -1) { 
					other_tile.walls.splice(other_index, 1);
				}
				console.log("OTHER tile:", other_tile.id, other_index !== -1, other_side);
			}	
			
			t.was_visited = true;
			// square = new PIXI.Graphics();
			// square.lineStyle(2, 0xFFFFFF, 1);
			// square.drawRect(25, 25, game.quad_width - 35, game.quad_height - 35);
			// square.x = pos.x;
			// square.y = pos.y;
			// square.alpha = 0.4;
			// maze.addChild(square);
		}
	});

	// draw!
	game_tiles.forEach( t => {
		// calculate position for tile 
		let column = t.id % num_cols;
		let cur_row = Math.floor(t.id / num_cols);
		let pos = {
			x: 5 + column * game.quad_width,
			y: 10 + cur_row * game.quad_height
		};


		// draw each wall
		t.walls.forEach( w => {
			let i = -1; // clockwise position index: 0,1,2,3 = top,right,bottom,left
			let rect = new PIXI.Graphics();
			rect.beginFill(color);

			switch (w) {
				case 0: 
				rect.drawRect(0, 0, game.quad_width, width);
				rect.x = pos.x;
				rect.y = pos.y;
				i = 0;
				break;
				case 1: 
				rect.drawRect(0, 0, width, game.quad_height);
				rect.x = pos.x + game.quad_width;
				rect.y = pos.y;
				i = 1;
				break;
				case 2: 
				rect.drawRect(0, 0, game.quad_width, width);
				rect.x = pos.x;
				rect.y = pos.y + game.quad_height;
				i = 2;
				break;
				case 3: 
				rect.drawRect(0, 0, width, game.quad_height);
				rect.x = pos.x;
				rect.y = pos.y;
				i = 3;
				break;
			}

			rect.endFill();
			rect.name = `${column}${cur_row}${i}`; // `Rectangle${h}${w}, ${s}`; // debug
			maze.addChild(rect);

			// for hit testing
			walls.push(rect);
		});

		// draw each pillar
		t.pillars.forEach( p => {

			// let col = 0xFF9900;
			let box = new PIXI.Graphics();
			box.beginFill(color);
			box.drawRect(0, 0, width, width);
			switch(p) {
				case 0:
				box.x = pos.x;
				box.y = pos.y;
				break;
				case 1:
				box.x = pos.x + game.quad_width;
				box.y = pos.y;
				break;
				case 2:
				box.x = pos.x + game.quad_width;
				box.y = pos.y + game.quad_height;
				break;
				case 3:
				box.x = pos.x;
				box.y = pos.y + game.quad_height;
				break;
			}
			box.endFill();
			// box.alpha = 0.2;
			box.name = `pillar${t.id}`;
			maze.addChild(box);
			walls.push(box);
		});


	});
	
	
}

function _getNextTileFrom (adjacent_tiles, game_tiles) {

	// make a copy ...
	var available_tiles = adjacent_tiles.slice(0);

	// pick an adjacent tile at random
	let random_index = Math.floor(Math.random() * available_tiles.length);
	let next_id = available_tiles[random_index];
	let next_tile = game_tiles.find( t => t.id === next_id);

	if (next_tile != null && next_tile.was_visited === true) {
		available_tiles.splice(random_index, 1);
		// pick another
		next_tile = _getNextTileFrom(available_tiles, game_tiles);
	} 

	return next_tile;
}

function getGameTiles () {

	let tiles = [
		{
			id: 0,
			was_visited: false,
			is_exit: false,
			walls: [0, 3],
			interior_walls: [1, 2],
			pillars: [0, 1, 2, 3],
			adjacent_tiles: [1, 5],
		},
		{
			id: 1,
			was_visited: false,
			is_exit: false,
			walls: [0],
			interior_walls: [1, 2],
			pillars: [1, 2],
			adjacent_tiles: [2, 6] // exclude 0
		},
		{
			id: 2,
			was_visited: false,
			is_exit: true,
			walls: [],
			interior_walls: [1, 2],
			pillars: [1, 2],
			adjacent_tiles: [1, 3, 7]
		},
		{
			id: 3,
			was_visited: false,
			is_exit: false,
			walls: [0],
			interior_walls: [1, 2],
			pillars: [1, 2],
			adjacent_tiles: [2, 4, 8]
		},
		{
			id: 4,
			was_visited: false,
			is_exit: false,
			walls: [0, 1],
			interior_walls: [2],
			pillars: [1, 2],
			adjacent_tiles: [3, 9]
		},
		{
			id: 5,
			was_visited: false,
			is_exit: true,
			walls: [],
			interior_walls: [1, 2],
			pillars: [2, 3],
			adjacent_tiles: [0, 6, 10]
		},
		{
			id: 6,
			was_visited: false,
			is_exit: false,
			walls: [],
			interior_walls: [1, 2],
			pillars: [2],
			adjacent_tiles: [1, 7, 11] // exclude 5
		},
		{
			id: 7,
			was_visited: false,
			is_exit: false,
			walls: [],
			interior_walls: [1, 2],
			pillars: [2],
			adjacent_tiles: [2, 6, 8, 12]
		},
		{
			id: 8,
			was_visited: false,
			is_exit: false,
			walls: [],
			interior_walls: [1, 2],
			pillars: [2],
			adjacent_tiles: [3, 7, 9, 13]
		},
		{
			id: 9,
			was_visited: false,
			is_exit: true,
			walls: [],
			interior_walls: [2],
			pillars: [2],
			adjacent_tiles: [4, 8, 14]
		},
		{
			id: 10,
			was_visited: false,
			is_exit: false,
			walls: [2, 3],
			interior_walls: [1],
			pillars: [2, 3],
			adjacent_tiles: [5, 11]
		},
		{
			id: 11,
			was_visited: false,
			is_exit: false,
			walls: [2],
			interior_walls: [1],
			pillars: [2],
			adjacent_tiles: [6, 12] // exclude 10
		},
		{
			id: 12,
			was_visited: false,
			is_exit: true,
			walls: [],
			interior_walls: [1],
			pillars: [2],
			adjacent_tiles: [7, 11, 13]
		},
		{
			id: 13,
			was_visited: false,
			is_exit: false,
			walls: [2],
			interior_walls: [1],
			pillars: [2],
			adjacent_tiles: [8, 12, 14]
		},
		{
			id: 14,
			was_visited: false,
			is_exit: false,
			walls: [1, 2],
			interior_walls: [],
			pillars: [2],
			adjacent_tiles: [9, 13]
		}
	];

	// "deep copy" clone
	return JSON.parse(JSON.stringify(tiles));
}

/*******************************************************************************
 * Game UI, score and num players icons
 *******************************************************************************/

function getGameUI (options_obj) {

	// unpack
	var { stage, game } = options_obj;

	// more globals
	var num_digits = 5;
	var score_container;
	var players_remaining;
	var score_cntr;
	var bonus_text;
	var digits_sprites = [];

	var anykey_subhead, logo_img;
	var splashScreen = {
		create () {
			
			var splash_header = document.createElement('div');
			splash_header.style = "margin:0 auto;color:#FF0000;font-size:96px;font-family:sans-serif;font-weight:bold;text-align:center";
			logo_img = document.createElement('img');
			logo_img.src = 'images/berzerk_splash.png';
			logo_img.style = "width:1024px;margin:0 auto";
			anykey_subhead = document.createElement('h2');
			anykey_subhead.style = "margin-top:-50px;color:#FFFF00;font-family:sans-serif;font-size:32px;text-align:center;font-weight:normal";
			document.body.appendChild(splash_header);
			splash_header.appendChild(logo_img);
			document.body.appendChild(anykey_subhead);
		},
		show () {
			
			anykey_subhead.textContent = "HIT ANY KEY";
			logo_img.style.display = 'block';
		},
		hide () {

			anykey_subhead.textContent = "";
			logo_img.style.display = 'none';
		}
	};

	function update () {

		_updateScore();
	}

	function _updateScore () {

		var score_str = _getScoreString();
		var x_index = -1;
		for (var c = 0, len = score_str.length; c < len; c++) {
			x_index = _getXindexForChar(score_str[c]);
			digits_sprites[c].texture.frame = new PIXI.Rectangle(x_index, 0, 8, 9);
		}
	}

	function showBonus () {

		_resetBonusText();
		bonus_text.visible = true;
	}

	function resetScore (num_remaining) {

		if (score_container != null) {
			stage.removeChild(score_container);
		}
		score_container = new PIXI.Container();
		score_container.x = 10;
		score_container.y = 710;

		score_cntr = new PIXI.Container();
		score_cntr.x = 30;
		score_cntr.y = 0;
		var cur_digit;
		var score_str = _getScoreString();
		digits_sprites = []; // reset
		for (var i = 0; i < num_digits; i++) {
			cur_digit = _getDigit(score_str, i);
			score_cntr.addChild(cur_digit);
			digits_sprites.push(cur_digit);
		}
		score_container.addChild(score_cntr);

		players_remaining = new PIXI.Container();
		players_remaining.x = 300;
		players_remaining.y = 0;
		for (var j = 0; j < num_remaining - 1; j++) {
			players_remaining.addChild(_getPlayerIcon(j));
		}
		score_container.addChild(players_remaining);

		bonus_text = new PIXI.Container();
		bonus_text.x = 400;
		bonus_text.y = 0;
		_resetBonusText();
		bonus_text.visible = false;
		score_container.addChild(bonus_text);

		// BONUS text + 3 digit sprites
		stage.addChild(score_container);
	}

	function _resetBonusText () {

		bonus_text.removeChildren();
		var bonus_str = "BONUS " + game.level_bonus;
		var char_tex, char_sprite, x_index, rect;
		var padding = 2;
		var width = 8;
		for (var i = 0, num_chars = bonus_str.length; i < num_chars; i++) {
			char_tex = PIXI.loader.resources["images/charset.png"].texture.clone();
			char_sprite = new PIXI.Sprite(char_tex);
			x_index = _getXindexForChar(bonus_str[i]);
			rect = new PIXI.Rectangle(x_index, 0, 8, 9);
			char_tex.frame = rect;
			char_sprite.scale.set(4, 4);
			char_sprite.tint = 0xFFFFFF;
			char_sprite.x = i * (width * 4) + (padding * i);
			char_sprite.y = 0;
			char_sprite.name = `char${i}`;
			bonus_text.addChild(char_sprite);
		}
	}

	function _getPlayerIcon (index) {

		var man_tex = PIXI.loader.resources["images/charset.png"].texture.clone();
		var icon_sprite = new PIXI.Sprite(man_tex);
		var width = 8;
		var padding = 4;
		var rect = new PIXI.Rectangle(778, 0, width, 9);
		man_tex.frame = rect;
		icon_sprite.scale.set(4, 4);
		icon_sprite.tint = 0x00FF00;
		icon_sprite.x = index * (width * 4) + (padding * index);
		icon_sprite.y = 0;
		icon_sprite.name = 'man0';

		return icon_sprite;
	}

	function _getDigit (score_str, index) {

		var digit_tex = PIXI.loader.resources["images/charset.png"].texture.clone();
		var digit_sprite = new PIXI.Sprite(digit_tex);
		var width = 8;
		var padding = 2;
		var x_index = _getXindexForChar(score_str[index]);
		var rect_d = new PIXI.Rectangle(x_index, 0, width, 9);
		digit_tex.frame = rect_d;
		digit_sprite.scale.set(4, 4);
		digit_sprite.tint = 0x00FF00;
		digit_sprite.x = index * (width * 4) + (padding * index);
		digit_sprite.y = 0;
		digit_sprite.name = `digit${index}`;

		return digit_sprite;
	}

	function _getScoreString () {

		var score_str = "" + game.score;
		// catch scores 100,00 and up ...
		if (score_str.length > 5) {
			throw new Error('score is greater then 99,999!!! fix me!');
		}

		// front-load zeros as needed
		var num_paddings = num_digits - score_str.length;
		for (var d = 0; d < num_paddings; d++) {
			score_str = ' ' + score_str;
		}

		return score_str;
	}

	function _getXindexForChar (c) {

		var width = 8;
		return (c.charCodeAt(0) - 31) * width;
	}

	return {
		splashScreen,
		update,
		showBonus,
		resetScore
	};
}

function getHowlerAudio () {

	var talking_audio = {
	 		a: 			[0, 280],
	 		ALERT: 		[340, 360],
	 		attack: 	[770, 380],
	 		charge: 	[1220, 410],
	 		chicken: 	[1700, 450],
	 		coins: 		[2200, 450],
	 		destroy: 	[2730, 600],
	 		detected: 	[3380, 600],
	 		escape: 	[4010, 470],
	 		fight: 		[4560, 300],
	 		get: 		[4870, 290],
	 		got: 		[5230, 320],
	 		humanoid: 	[5700, 660],
	 		"in": 		[6430, 390],
	 		INTRUDER: 	[6860, 600],
	 		it: 		[7500, 200],
	 		kill: 		[7790, 340],
	 		like: 		[8200, 320],
	 		must: 		[8570, 320],
	 		not: 		[8940, 250],
	 		pocket: 	[12880, 400],
	 		robot: 		[15000, 550],
	 		shoot: 		[15620, 260],
	 		the: 		[15940, 334]
	 	};
	var sfx_audio = {
	 		player_bullet: 	[9250, 1000],
	 		player_dead: 	[10275, 2500],
	 		robot_bullet: 	[13310, 750],
	 		robot_dead: 	[14100, 800]
	 	};
	Object.assign(sfx_audio, talking_audio);

	var _sound = new Howl({
	 	src: ['audio/sound_sprite.mp3'],
	 	volume: 0.05,
	 	sprite: sfx_audio
	});

	/*******************************************************************************
	 * sound sequences
	 *******************************************************************************/
	function inSequence (arr, rate) {

		var snd = arr.shift();
		var id = _sound.play(snd);
		if (rate != null) {
			_sound.rate(rate, id);
		}
		if (arr.length > 0) {
			_sound.once('end', function () { 
				inSequence(arr, rate);
			}, id);
		}
		
	}
	Object.assign(_sound, { inSequence });
	
	return _sound;
}

// make stuff look pixelated
PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
// https://github.com/kittykatattack/learningPixi

/*******************************************************************************
 * Setup
 *******************************************************************************/
var game = {
	enemy_color: 0x000000,
	is_restarting: true,
	level_bonus: 0,
	max_robot_bullets: 1,
	next_robot_bullet_time: 150,
	quad_width: 200,
	quad_height: 225,
	score: 0,
	timer: 0
};
var player;
var evil_otto;
var gameState;
var walls = [];
var robots = [];
var bullets = [];
var robot_bullets = [];
var _num_players_remaining = 3;
var _game_over_timer = -1;
var pubSub = new Events(game);
var all_sprites = {};
var start_pos = {x: 90, y: 300};

var renderer = PIXI.autoDetectRenderer(
	1024, 768, 
	{antialias: false, transparent: false, resolution: 1}
);
document.body.appendChild(renderer.view);

var stage = new PIXI.Container();
renderer.render(stage);

var maze = new PIXI.Container();
stage.addChild(maze);

// score, game over screen ...
var UI = getGameUI({ stage, game });
UI.splashScreen.create();

var sound = getHowlerAudio();

// APP STARTS-UP HERE ...
PIXI.loader
	.add("images/robot.png")
	.add("images/robot-explode.png")
	.add("images/player.png")
	.add("images/evil-otto.png")
	.add("images/charset.png")
	.load(setup);

function setup() {
	
	pubSub.listenTo(game, 'all_robots_killed', handleAllRobotsKilled);
	pubSub.listenTo(game, 'got_the_humanoid', handleHumanoidGot);
	pubSub.listenTo(game, 'shot_fired', handleShotFired);
	pubSub.listenTo(game, 'player_exiting_maze', handlePlayerExit);
	pubSub.listenTo(game, 'TESTING', handleTestKeyPressed);
	resetGameState();
	gameLoop();	
}

function resetGameState () {
	// listen for any key
	function fn () { 
		window.removeEventListener("keydown", fn); 
		gameState = gameRestarting;
		renderer.view.className = "";
	}
	window.addEventListener("keydown", fn, false);
	gameState = gameDormant;
}

/*******************************************************************************
 * GAME PLAY LOOP
 *******************************************************************************/
function gameLoop() {

	requestAnimationFrame(gameLoop);
	game.timer += 1;
	gameState();
	renderer.render(stage);
}

/*******************************************************************************
 * SETUP GAME
 *******************************************************************************/
function gameRestarting () {
	
	// clean up
	maze.x = 0;
	maze.y = 0;
	maze.removeChildren(); // clean up children too? children.forEach( function (c) { c.destroy(); }); 
	walls = [];
	robots = [];
	if (evil_otto != null) { evil_otto.destroy(); } // clean up
	keyboard.removeListeners();
	UI.splashScreen.hide();

	UI.resetScore(_num_players_remaining);

	// initialize
	game.timer = 0;
	game.next_robot_bullet_time = 150;
	game.enemy_color = getEnemyColor();
	game.max_robot_bullets = getMaxNumRobotBullets();
	
	if (_num_players_remaining > 0) {
		player = getPlayer({ start_pos, bullets, game, sound, pubSub });
		maze.addChild(player);
		drawWalls({ walls, maze, start_pos, game });
		gameState = gameStart;
		game.is_restarting = false; 

	} else { // RESET
		game.score = 0;
		_num_players_remaining = 3;
		_game_over_timer = game.timer + 30;
		gameState = gameOver;
		game.is_restarting = true;
	}

	evil_otto = getEvilOtto({ pos: {x: 0, y: 0}, player, robots, start_pos, maze, sound, game });
	
	keyboard.addTestKey({ pubSub, game });
}

function gameStart () {

	player.visible = true;
	getRobots();
	for (var r = 0, r_len = robots.length; r < r_len; r++) {
		maze.addChild(robots[r]);
	}
	evil_otto.delay_timer = robots.length * 115;
	game.level_bonus = robots.length * 10;

	// toggle : pause the game
	var ESC = keyboard.listen('Escape');
	ESC.press = function () { 
			gameState = (gameState === gamePlay) ? gamePaused : gamePlay;
	};
	ESC.release = function () { /* no op */ };
	//

	all_sprites = { player, walls, robots, robot_bullets, bullets, evil_otto };
	gameState = gamePlay;
}

function gameDormant () {
	renderer.view.className = "hidden";
	UI.splashScreen.show();
}

function gamePlay () {

	hitTestAll(all_sprites);
	player.tick();
	evil_otto.tick();
	updateRobots();
	updateBullets();
	UI.update(); // score, etc ... including debug stuff – in layout.js
}

function gamePaused () { /* no op */ }

// exit level velocity
var x_vel = 0;
var y_vel = 0;
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

	if (game.timer > _game_over_timer) {
		gameState = resetGameState;
	} else {
		renderer.view.className = "hidden";
	}
}

/*******************************************************************************
 * some pubSub message handlers
 *******************************************************************************/
function handleAllRobotsKilled () {

	console.log('handleAllRobotsKilled');
	game.score += game.level_bonus;
	UI.showBonus();
}

function handleHumanoidGot () {

	console.log('handleHumanoidGot');
	stage.removeChild(player);
	if (game.timer - player.death_start_timer - player.death_anim_duration > player.blinking_duration) {
		_num_players_remaining -= 1;
		game.is_restarting = true;
		start_pos = {x: 90, y: 300};
		gameState = gameRestarting;
	}
}

function handleShotFired (game, sprite) {

	console.log('handleShotFired', sprite.name);
	var shot = getBullet(sprite, game);
	maze.addChild(shot);

	if (sprite.name === "humanoid") {
		bullets.push(shot);
		sound.play('player_bullet');
	} else {
		// robot shot
		robot_bullets.push(shot);
		sound.play('robot_bullet');
	}
}

function handlePlayerExit (game, exit_side) {

	maze.children.forEach( function (child) {
		child.tint = 0x0000FF;
	});

	x_vel = 0;
	y_vel = 0;
	var rate = 7;
	switch (exit_side) {
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
	var random_rate = Math.random() + 0.5;	
	if (robots.length !== 0) {
		sound.inSequence('chicken fight like a robot'.split(' '), random_rate);
	} else {
		sound.inSequence('the humanoid must not escape'.split(' '), random_rate);
	}

	gameState = exitingLevel;
}


function handleTestKeyPressed () {

	walls.forEach ( w => maze.removeChild(w) );
	walls = [];
	drawWalls({ walls, maze, start_pos, game });

}

/*******************************************************************************
 * bullets
 *******************************************************************************/
function updateBullets () {

	for (var i = 0, s_len = bullets.length; i < s_len; i++) {
		bullets[i].tick();
	}
	for (var j = 0, rs_len = robot_bullets.length; j < rs_len; j++) {
		robot_bullets[j].tick();
	}
}

/*******************************************************************************
 * robots
 *******************************************************************************/
function getRobots () {

	var max_num_robots = 12, min_num_robots = 3;
	var num_robots = max_num_robots; // Math.floor(Math.random() * (max_num_robots - min_num_robots)) + min_num_robots;
	var possible_positions = _getPossiblePositions();
	var robot, robot_pos;

	for (var r = 0; r < num_robots; r++) {

		robot = getRobot({ max_num_robots, robots, robot_bullets, walls, maze, game, sound, pubSub });

		var random_index = Math.floor(Math.random() * possible_positions.length);
		robot_pos = possible_positions.splice(random_index, 1)[0];
		robot_pos.x += Math.floor(Math.random() * 50) - 25;
		robot_pos.y += Math.floor(Math.random() * 50) - 25;
		robot.position.set(robot_pos.x, robot_pos.y);
		robot.index = r;

		robots.push(robot);
	}
}

function _getPossiblePositions () {

	var num_cols = 5;
	var num_rows = 3;
	var x_pos = game.quad_width * 0.5;
	var y_pos = game.quad_height * 0.5;
	var positions = [];
	var pos = {};
	var player_start = {
		col: Math.floor(start_pos.x / game.quad_width),
		row: Math.floor(start_pos.y / game.quad_height)
	};

	for (var row = 0; row < num_rows; row++) {

		x_pos = game.quad_width * 0.5;
		for (var col = 0; col < num_cols; col++) {

			// skip the first box, since the player is there already
			// TODO fix this to look for the players pos (start_pos)
			if (row === player_start.row && col === player_start.col) { 
				x_pos += game.quad_width;
				continue; 
			}
			pos = {
				x: x_pos,
				y: y_pos
			};
			positions.push(pos);
			x_pos += game.quad_width;
		}

		y_pos += game.quad_height;
	}
	return positions;
}

function updateRobots () {

	if (game.timer > game.next_robot_bullet_time) {
		game.next_robot_bullet_time += 30;
	}
	for (var i = 0, r_len = robots.length; i < r_len; i++) {
		robots[i].tick(player);
	}
}

// for robots and evil otto
/*
	Yellow robots that do not fire
	Red robots that can fire 1 bullet (500 points)
	Cyan robots that can fire 2 bullets (1,500 points)
	Green robots that fire 3 bullets (3k)
	Purple robots that fire 4 bullets (4.5k)
	Yellow robots that fire 5 bullets (6k)
	White robots that fire 1 fast bullet (7.5k)
	Cyan robots that fire 2 fast bullets (10k)
	Purple robots that fire 3 fast bullets (11k)
	Gray robots that fire 4 fast bullets (13k)
	Yellow robots that fire 5 fast bullets (15k)
	Red robots that fire 5 fast bullets (17k)
	Cyan robots that fire 5 fast bullets (19k)
*/
var score_tiers = [500, 1500, 3000, 4500, 6000, 7500, 10000, 11000, 13000, 15000, 17000, 19000];
function getEnemyColor () {

	var colors = [0xFFFF00, 0xFF0000, 0x00FFFF, 0x00FF00, 0xFF00FF, 0xFFFF00, 0xFFFFFF, 0x00FFFF, 0xFF00FF];
	var col = colors[0];

	if (game.score >= score_tiers[0]) { col = colors[1]; }
	if (game.score >= score_tiers[1]) { col = colors[2]; }
	if (game.score >= score_tiers[2]) { col = colors[3]; }
	if (game.score >= score_tiers[3]) { col = colors[4]; }
	if (game.score >= score_tiers[4]) { col = colors[5]; }
	if (game.score >= score_tiers[5]) { col = colors[6]; }
	if (game.score >= score_tiers[6]) { col = colors[7]; }
	if (game.score >= score_tiers[7]) { col = colors[8]; }
	if (game.score >= score_tiers[8]) { col = Math.floor(Math.random() * 0xFFFFFF); } // MAX
	return col;
}

function getMaxNumRobotBullets () {

	var num_bullets = [0, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5];
	var num = num_bullets[0];

	if (game.score >= score_tiers[0]) { num = num_bullets[1]; }
	if (game.score >= score_tiers[1]) { num = num_bullets[2]; }
	if (game.score >= score_tiers[2]) { num = num_bullets[3]; }
	if (game.score >= score_tiers[3]) { num = num_bullets[4]; }
	if (game.score >= score_tiers[4]) { num = num_bullets[5]; }
	if (game.score >= score_tiers[5]) { num = num_bullets[6]; } 	// fast bullets
	if (game.score >= score_tiers[6]) { num = num_bullets[7]; }
	if (game.score >= score_tiers[7]) { num = num_bullets[8]; }
	if (game.score >= score_tiers[8]) { num = 5; } 				// MAX
	return num;
}
