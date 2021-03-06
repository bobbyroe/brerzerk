import keyboard from "./keyboard.js";
import { getOutOfBoundsSide } from "./utils.js";

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
		player_sprite.is_invincible = false;

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


export default getPlayer;
