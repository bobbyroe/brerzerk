/**
 *
 * GLOBALS: loader, 
 * PIXI globals: Sprite, Rectangle
 * fns: keyboard, fire
 *
 **/

function getPlayer () {

	var player_tex = loader.resources["images/player.png"].texture;
	player_sprite = new Sprite(player_tex);
	var rect = new Rectangle(0, 0, 8, 17);
	player_tex.frame = rect;
	player_sprite.x = 150;
	player_sprite.y = 90;
	player_sprite.vx = 0;
	player_sprite.vy = 0;
	player_sprite.ax = 0; // aim.x
	player_sprite.ay = 0; // aim.y
	player_sprite.scale.set(4, 4);
	player_sprite.ctrl_keys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
	player_sprite.rate = 2;
	player_sprite.death_anim_duration = 80;
	player_sprite.tint = 0x00FF00;
	player_sprite.was_hit = false;
	
	setUpCtrlsFor(player_sprite);

	return player_sprite;
}

function setUpCtrlsFor (sprite) {

	var moveUp = keyboard(sprite.ctrl_keys[0]);
	var moveRight = keyboard(sprite.ctrl_keys[1]);
	var moveDown = keyboard(sprite.ctrl_keys[2]);
	var moveLeft = keyboard(sprite.ctrl_keys[3]);

	moveLeft.press = function () {
		if (moveLeft.shiftKey === true) {
			sprite.ax = sprite.rate * -1;
			fire(sprite);
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
			sprite.ax = sprite.rate;
			fire(sprite);
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
			sprite.ay = sprite.rate * -1;
			fire(sprite);
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
			sprite.ay = sprite.rate;
			fire(sprite);
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