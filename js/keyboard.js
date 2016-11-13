/*******************************************************************************
 * keyboard.js
 *******************************************************************************/

var listeners = [];
function handle (code) {

	var key = {
		code: code,
		isDown: false,
		isUp: true,
		press: null,
		release: null,
		shiftKey: false
	};

	key.downHandler = function (evt) {

		if (evt.code === key.code) {
			key.shiftKey = evt.shiftKey;
			if (key.isUp && key.press) { key.press(); }
			key.isDown = true;
			key.isUp = false;
		}
		evt.preventDefault();
	};

	key.upHandler = function(evt) {
		if (evt.code === key.code) {
			key.shiftKey = evt.shiftKey;
			if (key.isDown && key.release) { key.release(); }
			key.isDown = false;
			key.isUp = true;
		}
		evt.preventDefault();
	};

	var dnFn = key.downHandler.bind(key);
	var upFn = key.upHandler.bind(key);
	listeners.push({
		down: { type: 'keydown', fn: dnFn },
		up: { type: 'keyup', fn: upFn }
	});
	
	return key;
}

function removeListeners () {
	listeners = [];
}

// one set of listeners for all!
function onKeyDown (evt) {

	for (var l = 0, len = listeners.length; l < len; l++) {
		listeners[l].down.fn(evt);
	}
}

function onKeyUp (evt) {

	for (var l = 0, len = listeners.length; l < len; l++) {
		listeners[l].up.fn(evt);
	}
}

function init () {
	window.addEventListener("keydown", onKeyDown, false);
	window.addEventListener("keyup", onKeyUp, false);
}

export { handle, removeListeners, init };
