<script>
	import abcjs from 'abcjs';
	import { noteLetterABC } from '$lib/utils.js';

	export let abcObj = {
		chord: null,
		key: null,
		isSharp: null,
		clef: null,
		scale: null,
	};
	export let name;

	$: if (abcObj.chord) {
		console.log('C1', name, abcObj);
		showChord(abcObj.chord, abcObj.key);
	}
	$: if (abcObj.scale) {
		console.log('S1', name, abcObj);
		showScale(abcObj.clef, abcObj.key, abcObj.scale);
	}

	const x = 6;

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

	function abcChord(chord, key) {
		const values = Object.values(chord);
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
				'[V:1] [' +
				noteLetterABC(values, 'treble', abcObj.isSharp) +
				']\n' +
				'[V:2] [' +
				noteLetterABC(values, 'bass', abcObj.isSharp) +
				']\n'
			);
		} else {
			return (
				'L:1/4\nK:' + key + ' ' + clef + '\n[' + noteLetterABC(values, '', abcObj.isSharp) + ']\n'
			);
		}
	}

	function showChord(chord, key) {
		const abcText = abcChord(chord, key);
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
			staffwidth: 200,
		});
	}

	function abcScale(clef, key, scaleNotes) {
		return 'L:1/4\nK:' + key + ' ' + clef + '\n' + scaleNotes + '\n';
	}

	function showScale(clef, key, scaleNotes) {
		const abcText = abcScale(clef, key, scaleNotes);
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
			staffwidth: 200,
		});
	}

	function unselect() {
		// MUH fill is always == "currentColor" !?
		Array.from(document.getElementsByTagName('path'))
			.filter((p) => p.getAttribute('fill') === '#ff0000')
			.forEach((p) => p.setAttribute('fill', null));
	}
</script>

<div class="h-80 w-96">
	<div id={name} />
</div>
