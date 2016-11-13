/*******************************************************************************
 * audio.js
 ******************************************************************************/

function getHowlerAudio () {

	var talking_audio = {
	 		a: 			[0, 280],
	 		ALERT: 		[340, 360],
	 		attack: 	[770, 380],
	 		charge: 	[1220, 410],
	 		chicken: 	[1700, 450],
	 		coins: 		[2200, 450],
	 		destroy: 	[2730, 600],
	 		detected: 	[3380, 600],
	 		escape: 	[4010, 470],
	 		fight: 		[4560, 300],
	 		get: 		[4870, 290],
	 		got: 		[5230, 320],
	 		humanoid: 	[5700, 660],
	 		"in": 		[6430, 390],
	 		INTRUDER: 	[6860, 600],
	 		it: 		[7500, 200],
	 		kill: 		[7790, 340],
	 		like: 		[8200, 320],
	 		must: 		[8570, 320],
	 		not: 		[8940, 250],
	 		pocket: 	[12880, 400],
	 		robot: 		[15000, 550],
	 		shoot: 		[15620, 260],
	 		the: 		[15940, 334]
	 	};
	var sfx_audio = {
	 		player_bullet: 	[9250, 1000],
	 		player_dead: 	[10275, 2500],
	 		robot_bullet: 	[13310, 750],
	 		robot_dead: 	[14100, 800]
	 	};
	Object.assign(sfx_audio, talking_audio);

	function playSequence (arr) {

		var snd = arr.shift();
		var id = sound.play(snd);
		if (arr.length > 0) {
			sound.once('end', function () { 
				playSequence(arr);
			}, id);
		}
	}

	var sound = new Howl({
	 	src: ['audio/sound_sprite.mp3'],
	 	volume: 0.05,
	 	sprite: sfx_audio
	 });

	return Object.assign(sound, { playSequence });
}
/*******************************************************************************
 * sound sequences
 *******************************************************************************/


export { getHowlerAudio };
