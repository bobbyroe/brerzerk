/**
 *
 * GLOBALS: loader, timer, sound
 * PIXI globals: Sprite, Rectangle
 * fns: removeRobot
 *
 **/
var getRobot = (function () {
return function (pos) {
	var robot_tex = loader.resources["images/robot.png"].texture;
	var robot_sprite = new Sprite(robot_tex);

	var robot_explode_tex = loader.resources["images/robot-explode.png"].texture;
	var rect = rect = new Rectangle(0, 0, 8, 11);
	robot_tex.frame = rect;
	robot_sprite.vx = 0;
	robot_sprite.vy = 0;
	robot_sprite.scale.set(4, 4);
	robot_sprite.rate = 1;
	robot_sprite.explode_tex = robot_explode_tex;
	robot_sprite.explode_tex.num_frames = 3;
	robot_sprite.tint = 0xFF0000;
	robot_sprite.death_start_timer = -1;
	robot_sprite.timer_offset = Math.floor(Math.random() * 100);
	robot_sprite.tick = robotPlay;
	robot_sprite.x = pos.x;
	robot_sprite.y = pos.y;
	

	// ROBOT STATES
	function robotDead () {

		var frame_num = (Math.floor((timer - robot_sprite.death_start_timer) * 0.1) % 4);		
		if (frame_num < robot_sprite.explode_tex.num_frames) {
			robot_sprite.texture = robot_sprite.explode_tex;
			robot_sprite.anchor.x = 0.28;
			robot_sprite.anchor.y = 0.28;
			robot_sprite.texture.frame = new Rectangle( frame_num * 18, 0, 18, 18);
		} else {
			setTimeout(removeRobot, 1, robot_sprite);
		}
	}

	function robotPlay () {

		if (robot_sprite.was_hit === true) {

			robot_sprite.death_start_timer = timer;
			sound.play('robot_dead');
			robot_sprite.tick = robotDead;
		} else {

			robot_sprite.x += robot_sprite.vx;
			robot_sprite.y += robot_sprite.vy;

			// animate him
			if (robot_sprite.vy > 0) {
				robot_sprite.texture.frame = new Rectangle( (Math.round(timer * 0.2) % 2) * 8 + 64, 0, 8, 11);
			} else if (robot_sprite.vy < 0) {
				robot_sprite.texture.frame = new Rectangle( (Math.round(timer * 0.2) % 2) * 8 + 96, 0, 8, 11);
			}

			if (robot_sprite.vx > 0) {
				robot_sprite.texture.frame = new Rectangle( (Math.round(timer * 0.2) % 2) * 8 + 48, 0, 8, 11);
			} else if (robot_sprite.vx < 0) {
				robot_sprite.texture.frame = new Rectangle( (Math.round(timer * 0.2) % 2) * 8 + 80, 0, 8, 11);
			}

			if (robot_sprite.vx === 0 && robot_sprite.vy === 0) {
				robot_sprite.texture.frame = new Rectangle( (Math.round( (timer + robot_sprite.timer_offset) * 0.2) % 6) * 8, 0, 8, 11);
			}
		}
	}

	return robot_sprite;
}
})();