import { getNearbyWalls } from "./layout.js";
import { fire } from "./bullet.js";

/*******************************************************************************
 * robot.js
 ******************************************************************************/

var getRobot = (function () {

var robot_score = 50;
var robots_awake_time = 150;

return function (game_stuff) {

	let { 
	 	enemy_color, sound, pubSub, timer, next_bullet_time, robots, score, player, robot_bullets, max_robot_bullets, maze
	} = game_stuff;

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
	robot_sprite.bullet_velocity = getRobotBulletVelocity();
	robot_sprite.bullet_length = 6;
	robot_sprite.bullet_color = enemy_color;
	robot_sprite.was_hit = false;
	robot_sprite.qx = -1;
	robot_sprite.qy = -1;

	// public methods
	robot_sprite.tick = robotPlay;
	robot_sprite.aim = targetHumanoid;
	
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

			setTimeout(removeRobot, 1, robot_sprite);
		}
	}

	function robotPlay () {

		robot_sprite.frame_delay = 0.25 * (1 - robots.length * 0.11); // 2 / 12 (1 / max num robots)

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
				pubSub.dispatch('all_robots_killed', window);
			}

			robot_sprite.tick = robotDead;
		} else {

			if (timer < robots_awake_time === false) {
				robot_sprite.aim();
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

	function targetHumanoid () {

		robot_sprite.rate = 2 - (robots.length * 0.16); // 2 / 12 (max speed / max num robots)

		robot_sprite.ax = (robot_sprite.x - player.x > 1) ? -1 : 1;
		robot_sprite.ay = (robot_sprite.y - player.y > 1) ? -1 : 1;

		if (Math.abs(robot_sprite.x - player.x) < 20) { robot_sprite.ax = 0; }
		if (Math.abs(robot_sprite.y - player.y) < 20) { robot_sprite.ay = 0; }

		// update robot velocity
		robot_sprite.vx = robot_sprite.ax * robot_sprite.rate;
		robot_sprite.vy = robot_sprite.ay * robot_sprite.rate;
		
		var nearby_walls = getNearbyWalls(robot_sprite);
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
	

		if (timer < next_bullet_time === false && robot_bullets.length < max_robot_bullets) {

			if (Math.abs(robot_sprite.x - player.x) < 20 ||
				Math.abs(robot_sprite.y - player.y) < 20 ||
				Math.abs((robot_sprite.x - robot_sprite.y) - (player.x - player.y)) < 20 ||
				Math.abs((robot_sprite.x - player.y) - (player.x - robot_sprite.y)) < 20) {
					fire(robot_sprite);
			}	
		}
	}

	// 
	function getRobotBulletVelocity () {

		var vel = (score < 7500) ? 4 : 8;
		return vel;
	}

	function removeRobot (sprite) {

		maze.removeChild(sprite);
		robots.splice(robots.indexOf(sprite), 1);
		sprite.destroy();
	}

	return robot_sprite;
};

})();

export { getRobot }; 


