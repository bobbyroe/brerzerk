import { soundsInSequence } from "./audio.js";
/*******************************************************************************
 * evilotto.js
 ******************************************************************************/

var otto_sprite;
function getEvilOtto (pos) {

	if (evil_otto != null) { evil_otto.destroy(); } // clean up
	
	var otto_tex = PIXI.loader.resources["images/evil-otto.png"].texture;
	otto_sprite = new PIXI.Sprite(otto_tex);
	var rect = new PIXI.Rectangle(44, 0, 11, 43);
	otto_tex.frame = rect;
	otto_sprite.vx = 0;
	otto_sprite.vy = 0;
	otto_sprite.ax = 0; // aim.x
	otto_sprite.ay = 0; // aim.y
	otto_sprite.scale.set(4, 4);
	otto_sprite.rate = 2;
	otto_sprite.tint = enemy_color;
	otto_sprite.x = pos.x; // 150;
	otto_sprite.y = pos.y; // 90;
	otto_sprite.name = 'EVIL OTTO';
	otto_sprite.rate = 0.5;
	otto_sprite.delay_timer = 100000; // default
	
	// public methods
	otto_sprite.tick = ottoDormant;

	return otto_sprite;
}

var otto_frame_indices = [6,7,8,9,10,11,12,11,10,9,8,7];
var o_len = otto_frame_indices.length - 1;

function ottoPlay () {

	// direction = target position - object position
    var dx = player.x - otto_sprite.x;
    var dy = player.y - otto_sprite.y;
    var angle = Math.atan2(dy, dx);
    otto_sprite.rate = 2 - (robots.length * 0.16); // 2 / 12 (max speed / max num robots)

    otto_sprite.vx = Math.cos(angle) * otto_sprite.rate;
    otto_sprite.vy = Math.sin(angle) * otto_sprite.rate;
    
	otto_sprite.x += otto_sprite.vx;
	otto_sprite.y += otto_sprite.vy;

	// animate him
	var x_frame = otto_frame_indices[(Math.round(timer * (otto_sprite.rate * 0.4)) % o_len)] * 11; 
	otto_sprite.texture.frame = new PIXI.Rectangle( x_frame, 0, 11, 43);
	
}

function ottoDormant () {

	if (timer > otto_sprite.delay_timer) {
		soundsInSequence('INTRUDER ALERT INTRUDER ALERT'.split(' '));
		maze.addChild(evil_otto);
		otto_sprite.tick = ottoStart;
		evil_otto.position.set(start_pos.x, start_pos.y);
	}
}

function ottoStart () {

	var x_pos = (Math.round((timer - otto_sprite.delay_timer) * 0.1) % 8) * 11; 

	if (x_pos > 66) {
		otto_sprite.tick = ottoPlay;
	} else {
		// animate him
		otto_sprite.texture.frame = new PIXI.Rectangle(x_pos, 0, 11, 43);
	}
	
}

export { getEvilOtto };
