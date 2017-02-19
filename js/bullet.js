import { getOutOfBoundsSide, degToRad } from "./utils.js";

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

export default getBullet;