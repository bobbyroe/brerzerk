import { handle } from "./keyboard.js";
import { getOutOfBoundsSide } from "./layout.js";
import { fire } from "./bullet.js";
/*******************************************************************************
 * player.js
 ******************************************************************************/

var getPlayer = (function () {

var colors8 = [0xFFFFFF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFF0000, 0x00FF00];
return function (game_stuff) {

	let { 
	 	stage, sound, pubSub, is_game_restarting, start_pos, timer, bullets, next_bullet_time, num_players_remaining
	} = game_stuff;

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
	player_sprite.blinking_duration = (is_game_restarting === true) ? 120 : 10;
	player_sprite.bullet_delay = 30;
	player_sprite.next_bullet_time = 0;
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

		var moveUp = handle(sprite.ctrl_keys[0]);
		var moveRight = handle(sprite.ctrl_keys[1]);
		var moveDown = handle(sprite.ctrl_keys[2]);
		var moveLeft = handle(sprite.ctrl_keys[3]);

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
			timer < sprite.bullet_delay === false &&
			bullets.length < sprite.max_bullets) {

			sprite.next_bullet_time += sprite.bullet_delay;
			fire(sprite);
		}
	}

	function getTexFrameFor (sprite) {

		var rect = new PIXI.Rectangle(0, 0, 8, 17);

		if (sprite.vx > 0 || sprite.vy !== 0) {
			rect = new PIXI.Rectangle( (Math.round(timer * 0.4) % 3) * 8 + 8, 0, 8, 17);
		}

		if (sprite.vx < 0) {
			rect = new PIXI.Rectangle( (Math.round(timer * 0.4) % 3) * 8 + 40, 0, 8, 17);
		}
		return rect;
	}

	// PLAYER STATES
	function playerPending () {

		// blink player location
		if (timer < player_sprite.blinking_duration) {
			player_sprite.visible = (timer % 40 > 20);
		} else {
			player_sprite.visible = true;
			player_sprite.tick = playerPlay;
		}
	}

	function playerPlay () {

		if (timer > next_bullet_time) {
			next_bullet_time += 30;
		}

		var exit_side = getOutOfBoundsSide(player_sprite);
		if (exit_side !== 'none') {
			pubSub.dispatch('player_is_exiting', window, exit_side);
		}

		if (player_sprite.was_hit === true && player_sprite.is_invincible === false) {

			player_sprite.death_start_timer = timer;
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

		if (timer - player_sprite.death_start_timer < player_sprite.death_anim_duration) {
			// player death
			player_sprite.texture.frame = new PIXI.Rectangle((Math.round(timer * 0.4) % 4) * 8 + 80, 0, 8, 17);
			player_sprite.tint = colors8[Math.floor(Math.random() * colors8.length)];
		} else {
			stage.removeChild(player_sprite);
			if (timer - player_sprite.death_start_timer - player_sprite.death_anim_duration > player_sprite.blinking_duration) {
				num_players_remaining -= 1;
				is_game_restarting = true;
				start_pos = {x: 90, y: 300};
				pubSub.dispatch('player_has_died', window);
			}
		}
	}
	return player_sprite;
};
})();

export { getPlayer };
