/**
 *
 * GLOBALS: *timer
 * PIXI globals: Grfx
 * fns: removeBullet, isOutOfBounds
 *
 **/
var getBullet = (function () {

// helper fn
function degToRad (deg) {

	return deg * Math.PI / 180;
}

return function (sprite) {

	var direction = `${Math.abs(sprite.ax)}${Math.abs(sprite.ay)}`;
	var rotation = (sprite.ax + sprite.ay === 0) ? -45 : 45;
	var len = sprite.bullet_length;
	var shot = new Grfx();
	shot.beginFill(sprite.bullet_color);

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

	shot.x = sprite.x + 8;
	shot.y = sprite.y + 20;
	shot.scale.set(4, 4);
	shot.vx = sprite.ax * sprite.bullet_velocity;
	shot.vy = sprite.ay * sprite.bullet_velocity;
	shot.sprite = sprite;
	shot.endFill();
	shot.name = `${sprite.name} bullet${timer}`; // debug
	shot.tick = updateBullet;


	function updateBullet () {
		if (shot.was_hit === true) {
			setTimeout(removeBullet, 1, shot);
		} else {
			shot.x += shot.vx;
			shot.y += shot.vy;
			// bounds
			if (isOutOfBounds(shot) === true) {
				setTimeout(removeBullet, 1, shot);
			}
		}
	}
	return shot;
}

})();


