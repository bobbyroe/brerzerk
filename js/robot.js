
/**
 *
 * GLOBALS: loader, sound, score
 *
 **/

var getRobot = (function () {

var robot_score = 50;
var robots_awake_time = 150;

return function (options_obj) {

	// unpack
	var { max_num_robots, robots, robot_bullets, walls, enemy_color, maze, BZRK, sound, pubSub } = options_obj;

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
	robot_sprite.tint = enemy_color;
	robot_sprite.death_start_timer = -1;
	robot_sprite.timer_offset = Math.floor(Math.random() * 100);
	robot_sprite.index = -1;
	robot_sprite.name = `robot${timer}`;

	robot_sprite.bullets = robot_bullets;
	robot_sprite.bullet_velocity = getRobotBulletVelocity();
	robot_sprite.bullet_length = 6;
	robot_sprite.bullet_color = enemy_color;
	robot_sprite.was_hit = false;
	robot_sprite.qx = -1;
	robot_sprite.qy = -1;

	// public methods
	robot_sprite.tick = robotPlay;
	
	// animation vars
	robot_sprite.frame_delay = 0.25; // smaller == slower

	// ROBOT STATES
	function robotDead () {

		var frame_num = (Math.floor((timer - robot_sprite.death_start_timer) * 0.1) % 4);		
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

		var anim_frame_index = (Math.round(timer * robot_sprite.frame_delay) % 2) * 8;
		var standing_frame_index = (Math.round( (timer + robot_sprite.timer_offset) * robot_sprite.frame_delay) % 6) * 8;
		var robots_left = -1;
		if (robot_sprite.was_hit === true) {
			
			robot_sprite.death_start_timer = timer;
			sound.play('robot_dead');
			score += robot_score;

			// if all robots have been killed, award bonus
			robots_left = robots.filter( r => (r.was_hit === false)).length;
			if (robots_left === 0) {
				pubSub.dispatch('all_robots_killed', BZRK);
			}

			robot_sprite.tick = robotDead;
		} else {

			if (timer < robots_awake_time === false) {
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
	
		if (timer >= next_robot_bullet_time && robot_sprite.bullets.length < max_robot_bullets) {

			if (Math.abs(robot_sprite.x - player_sprite.x) < 20 ||
				Math.abs(robot_sprite.y - player_sprite.y) < 20 ||
				Math.abs((robot_sprite.x - robot_sprite.y) - (player_sprite.x - player_sprite.y)) < 20 ||
				Math.abs((robot_sprite.x - player_sprite.y) - (player_sprite.x - robot_sprite.y)) < 20) {
					fire(robot_sprite);
			}	
		}
	}

	// 
	function getRobotBulletVelocity () {

		var vel = (score < 7500) ? 4 : 8;
		return vel;
	}

	function _getNearbyWalls (sprite) {

		var top = false;
		var right = false;
		var bottom = false;
		var left = false;
		sprite.qx = Math.floor(sprite.x / quad_width);
		sprite.qy = Math.floor(sprite.y / quad_height);

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
