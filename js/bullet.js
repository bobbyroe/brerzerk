// 
function getBullet (sprite) {

	var direction = "" + Math.abs(sprite.ax / sprite.rate) + Math.abs(sprite.ay / sprite.rate);
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
	shot.endFill();
	shot.name = `shot ${timer}`; // debug
	return shot;
}


// helper fn
function degToRad (deg) {

	return deg * Math.PI / 180;
}