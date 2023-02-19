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

export function noteLetterABC(chord, clef, isSharp) {
	// ABC notation reference: https://abcnotation.com/wiki/abc:standard:v2.1#pitch
	// We are numbering the notes starting with C0 = 0, D0 = 1 and so on. Thus C4 = 48.
	let letters = [];
	for (let value of Object.values(chord)) {
		if (clef == 'treble' && value < 60) continue;
		if (clef == 'bass' && value >= 60) continue;
		if (value == 0) {
			return 'z';
		}
		value -= 12; // convert from midi number to ABC numbering, midi C4=60
		const letter = noteLetter(value, isSharp);
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

export function keyLetterABC(note) {
	return ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'As', 'A', 'Bb', 'B'][note];
}
