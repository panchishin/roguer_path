'use strict';

export function randint(lowerbound,upperbound) {
	return Math.floor(Math.random() * (upperbound-lowerbound+1)) + lowerbound;
}

export function shuffle(array) {
	let currentIndex = array.length,  randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}

	return array;
}

export function assert(statement) {
	if (!statement) {
		var err = new Error();
    	console.log(err.stack);
		throw "Wrong!";
	}
}
