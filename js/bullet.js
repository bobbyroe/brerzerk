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

	var bullet_velocity = 4;
	var direction = `${Math.abs(sprite.ax / sprite.rate)}${Math.abs(sprite.ay / sprite.rate)}`;
	var rotation = (sprite.ax + sprite.ay === 0) ? -45 : 45;

	var shot = new Grfx();
	shot.beginFill(0x00FF00);

	switch (direction) {
		case '01': 
		shot.drawRect(0, 0, 1, 8);
		break;
		case '10': 
		shot.drawRect(0, 0, 8, 1);
		break;
		case '11': 
		shot.drawRect(0, 0, 8, 1);
		shot.rotation = degToRad(rotation);
		break;
	}

	shot.x = sprite.x + 8;
	shot.y = sprite.y + 20;
	shot.scale.set(4, 4);
	shot.vx = sprite.ax * bullet_velocity;
	shot.vy = sprite.ay * bullet_velocity;
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


