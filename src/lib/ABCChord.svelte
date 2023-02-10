<script>
	import abcjs from 'abcjs';

	export let chord;
	export let name;
	export let key;
	export let isSharp;

	$: if (chord) showNotes(chord, key);

	const x = 6;

	function noteLetter(v) {
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

	function noteLetterABC(chord, clef) {
		// ABC notation reference: https://abcnotation.com/wiki/abc:standard:v2.1#pitch
		// We are numbering the notes starting with C0 = 0, D0 = 1 and so on. Thus C4 = 48.
		let letters = [];
		for (let value of Object.values(chord)) {
			if (clef == 'treble' && value < 60) continue;
			if (clef == 'bass' && value >= 60) continue;
			if (value == 0) {
				return '[z]';
			}
			value -= 12; // convert from midi number to ABC numbering, midi C4=60
			const letter = noteLetter(value);
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
		return '[' + letters.join('') + ']';
	}

	function minMax(chord) {
		let max = 0;
		let min = 255;
		for (let v of Object.values(chord)) {
			if (v > max) max = v;
			if (v < min) min = v;
		}
		return [min, max];
	}

	function staffFor(chord) {
		if (chord.length == 0) return '';
		const [min, max] = minMax(chord);
		// console.log('min', min, 'max', max);
		if (min < 60 - x && max > 60 + x) return 'piano';
		return clefFor(chord);
	}

	function clefFor(chord) {
		if (chord.length == 0) return '';
		const [min, max] = minMax(chord);
		if (max < 60) return 'bass';
		if (min >= 60 - x) return 'treble';
		return max < 60 + x ? 'bass' : 'treble';
	}

	function abc(chord, key) {
		const staff = staffFor(chord);
		const clef = clefFor(chord);
		// console.log('staff', staff, 'clef', clef, 'key', key);
		if (staff == '') return '\n';
		if (staff == 'piano') {
			return (
				// Multiple voices notation: https://abcnotation.com/wiki/abc:standard:v2.1#multiple_voices
				'L:1/4\n' +
				'%%score {1 2}\n' +
				'V:1 clef=treble\n' +
				'V:2 clef=bass\n' +
				'K:' +
				key +
				'\n' +
				'[V:1] ' +
				noteLetterABC(chord, 'treble') +
				'\n' +
				'[V:2] ' +
				noteLetterABC(chord, 'bass') +
				'\n'
			);
		} else {
			return 'L:1/4\nK:' + key + ' ' + clef + '\n' + noteLetterABC(chord, '') + '\n';
		}
	}

	function showNotes(chord, key) {
		const abcText = abc(chord, key);
		console.log('abcText', abcText);
		abcjs.renderAbc(name, abcText, {
			clickListener: () => unselect(),
			paddingtop: '0',
			paddingleft: '0',
			paddingbottom: '0',
			paddingright: '0',
			// It is somewhat tricky to size and layout an SVG image correctly. We start by setting 'responsive'
			// here, which lets us control size via the width of the parent object.
			responsive: 'resize',
			staffwidth: 80, // Sufficient to show a single quarter note.
		});
	}

	function unselect() {
		// MUH fill is always == "currentColor" !?
		Array.from(document.getElementsByTagName('path'))
			.filter((p) => p.getAttribute('fill') === '#ff0000')
			.forEach((p) => p.setAttribute('fill', null));
	}
</script>

<div class="h-80 w-60">
	<div id={name} />
</div>
