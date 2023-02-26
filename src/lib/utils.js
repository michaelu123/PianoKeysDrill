export function noteLetter(v, isSharp) {
	switch (v % 12) {
		case 0:
			return 'C';
		case 1:
			return isSharp ? '^C' : '_D';
		case 2:
			return 'D';
		case 3:
			return isSharp ? '^D' : '_E';
		case 4:
			return 'E';
		case 5:
			return 'F';
		case 6:
			return isSharp ? '^F' : '_G';
		case 7:
			return 'G';
		case 8:
			return isSharp ? '^G' : '_A';
		case 9:
			return 'A';
		case 10:
			return isSharp ? '^A' : '_B';
		case 11:
			return 'B';
	}
}

export function noteLetterABC(chord, clef, isSharp, fingering) {
	// ABC notation reference: https://abcnotation.com/wiki/abc:standard:v2.1#pitch
	// We are numbering the notes starting with C0 = 0, D0 = 1 and so on. Thus C4 = 48.
	let letters = [];
	let f = 0;
	for (let value of Object.values(chord)) {
		if (clef == 'treble' && value < 60) continue;
		if (clef == 'bass' && value >= 60) continue;
		if (value == 0) {
			return 'z';
		}
		value -= 12; // convert from midi number to ABC numbering, midi C4=60
		let letter = noteLetter(value, isSharp);
		if (fingering) {
			// only for scales, implies chord.length = 8
			letter = '!' + fingering[f] + '!' + letter;
			f++;
		}
		if (value < 12) {
			letters.push(letter + ',,,,');
		} else if (value < 24) {
			letters.push(letter + ',,,');
		} else if (value < 36) {
			letters.push(letter + ',,');
		} else if (value < 48) {
			letters.push(letter + ',');
		} else if (value < 60) {
			letters.push(letter);
		} else if (value < 72) {
			letters.push(letter.toLowerCase());
		} else if (value < 84) {
			letters.push(letter.toLowerCase() + "'");
		} else if (value < 96) {
			letters.push(letter.toLowerCase() + "''");
		}
	}
	return letters.join(' ');
}

export function keyLettersABC() {
	return ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
}

let maj2minObj = {
	C: 'a',
	Db: 'bb',
	D: 'b',
	Eb: 'c',
	E: 'c#',
	F: 'd',
	'F#': 'd#',
	Gb: 'eb',
	G: 'e',
	Ab: 'f',
	A: 'f#',
	Bb: 'g',
	B: 'g#',
};
let min2majObj = {
	a: 'C',
	bb: 'Db',
	b: 'D',
	c: 'Eb',
	'c#': 'E',
	d: 'F',
	'd#': 'F#',
	eb: 'Gb',
	e: 'G',
	f: 'Ab',
	'f#': 'A',
	g: 'Bb',
	'g#': 'B',
};

export function min2maj(key) {
	return min2majObj[key];
}

export function xxxmenuLetters(k) {
	// return ["c", "c#", "d", "d#", "eb", "e", "f", "f#", "g", "g#", "a", "bb", "b"];
	// return ['Eb', 'E', 'F', 'F#', 'Gb', 'G', 'As', 'A', 'Bb', 'B', 'C', 'Db', 'D'];
	return maj2min(k);
}

const major = ['C', 'G', 'F', 'D', 'Bb', 'A', 'Eb', 'E', 'Ab', 'B', 'Db', 'F#', 'Gb'];
const minor = ['a', 'e', 'd', 'b', 'g', 'f#', 'c', 'c#', 'f', 'g#', 'bb', 'd#', 'eb'];
const mixed = [
	'C',
	'a',
	'G',
	'e',
	'F',
	'd',
	'D',
	'b',
	'Bb',
	'g',
	'A',
	'f#',
	'Eb',
	'c',
	'E',
	'c#',
	'Ab',
	'f',
	'B',
	'g#',
	'Db',
	'bb',
	'F#',
	'd#',
	'Gb',
	'eb',
];
export function menuLetters(keys) {
	if (keys == 'major') return major;
	if (keys == 'minor') return minor;
	if (keys == 'mixed') return mixed;
}

const accidentals = {
	C: '',
	Db: 'b',
	D: '#',
	Eb: 'b',
	E: '#',
	F: 'b',
	'F#': '#',
	Gb: 'b',
	G: '#',
	Ab: 'b',
	A: '#',
	Bb: 'b',
	B: '#',
};

export function getAccidental(key) {
	return accidentals[key];
}
