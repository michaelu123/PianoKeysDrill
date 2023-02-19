<script>
	import { WebMidi, Utilities } from 'webmidi';
	import { onDestroy, onMount } from 'svelte';
	import { options } from '$lib/options.js';
	import ABCChord from '$lib/ABCChord.svelte';
	import { Chord } from '$lib/music21j/chord';
	import { goto } from '$app/navigation';
	import { noteLetterABC, keyLetterABC } from '$lib/utils.js';

	let errorMessage = '';
	let midiOutput = null;
	let _chord = {};
	let unEqual = false;
	let success = false;
	let lastRandomChordBase = -1;
	let lastKey = '';
	let tEqual = null;
	let tSound = null;
	let tSucc = null;
	let abcObj1 = { scale: null, midiScale: null, chord: null };
	let abcObj2 = { scale: null, midiScale: null, chord: null, pos: 0 };
	let easy = ['C', 'D', 'F', 'G'];
	let medium = ['C', 'D', 'F', 'G', 'A', 'Eb', 'Bb'];

	// scales stuff
	const fingeringsUp1 = [1, 2, 3, 1, 2, 3, 4, 5];
	const fingeringsUp2 = [1, 2, 3, 4, 1, 2, 3, 4];
	const fingeringsDown1 = [5, 4, 3, 2, 1, 3, 2, 1];
	const fingeringsDown2 = [4, 3, 2, 1, 4, 3, 2, 1];
	const majorIntervals = [2, 2, 1, 2, 2, 2, 1, 0];
	const minorIntervals = [2, 1, 2, 2, 1, 2, 2, 0];
	const accidentals = [
		'', // C
		'b', // Des
		'#', // D
		'b', // Es
		'#', // E
		'b', // F
		'#', // Fis (Ges)
		'#', // G
		'b', // As
		'#', // A
		'b', // Bb/B
		'#', // B/H
	];

	let abcScales = {};
	let midiScales = {};

	$: chordOutput = chordKeys(abcObj2.chord);

	function chordKeys(chord) {
		if (chord == null || chord.length == 0 || chord[''] == 0) return [''];
		// sort keys by increasing value (=note number)
		let keysSorted = Object.keys(chord).sort((a, b) => chord[a] - chord[b]);
		let m21Chord = new Chord(keysSorted);
		try {
			return (
				m21Chord.root().name +
				' ' +
				m21Chord.commonName +
				'(' +
				m21Chord.inversion() +
				')' +
				': ' +
				keysSorted
			);
		} catch (error) {
			console.log('ERR', error);
			return 'ERR';
		}
	}

	function addNote(note) {
		_chord[note.note.identifier] = note.note.number;
		return _chord;
	}

	function remNote(note) {
		delete _chord[note.note.identifier];
	}

	function chordEqual(chord1, chord2) {
		if (chord1 == null || chord2 == null) return false;
		let values1 = Object.values(chord1);
		let values2 = Object.values(chord2);
		if (values1.length != values2.length) return null;
		values1 = values1.sort();
		values2 = values2.sort();
		return values1.every((v, x) => v == values2[x]);
	}

	function getRndInteger(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}

	function randomChord() {
		let r;
		let mode = options.mode;
		let keys = options.keys;
		let low = Utilities.toNoteNumber(options.min);
		let max = Utilities.toNoteNumber(options.max) + 1;
		let high = mode == 'keys' ? max : max - 7; // so that we do not fold
		for (;;) {
			r = getRndInteger(low, high);
			if (r === lastRandomChordBase) continue;
			let id = Utilities.toNoteIdentifier(r);
			if (!options.withAccidentals && id.length > 2) continue;
			break;
		}
		lastRandomChordBase = r;
		let notes;
		if (keys == 'mixed') {
			keys = Math.random() < 0.5 ? 'major' : 'minor';
		}
		if (mode == 'keys') {
			notes = [r];
		} else if (keys == 'major') {
			notes = [r, r + 4, r + 7];
		} else if (keys == 'minor') {
			notes = [r, r + 3, r + 7];
		}
		if (mode == 'chords' && options.withInversions) {
			let i = getRndInteger(0, 3);
			if (i > 0) notes[0] += 12;
			if (i == 2) notes[1] += 12;
			for (let i = 0; i < 3; i++) {
				while (notes[i] < 33) notes[i] += 12;
				while (notes[i] >= 89) notes[i] -= 12;
			}
		}
		const c = {};
		for (let n of notes) {
			c[Utilities.toNoteIdentifier(n)] = n;
		}
		abcObj1.scale = null;
		abcObj1.isSharp = Math.random() < 0.5;
		abcObj1.key = 'C';
		abcObj1.chord = c;
		abcObj2.scale = null;
		abcObj2.isSharp = abcObj1.isSharp;
		abcObj2.key = 'C';
		abcObj2.clef = r < 60 ? 'bass' : 'treble';
		abcObj2.chord = { '': 0 };
		playChord(c);
		return c;
	}

	function playChord(chord) {
		if (!options.sound) return;
		console.log('playChord', midiOutput, Object.values(chord));
		midiOutput.channels[1].playNote(Object.values(chord), {
			duration: 500,
			attack: options.attack / 100.0,
		});
	}

	async function initMidi() {
		await WebMidi.enable((error) => {
			if (error) {
				console.log('Webmidi error', error);
				errorMessage = 'noMidiSupport';
				return;
			}
		});
		if (WebMidi.inputs.length < 1) {
			errorMessage = 'noMidi Input DeviceFound';
			return;
		}
		midiOutput = null;
		WebMidi.outputs.forEach((mo) => {
			if (!mo.name.toLowerCase().includes('through')) midiOutput = mo; // How do I detect midi through channels?
		});
		if (midiOutput == null) {
			errorMessage = 'noMidi Output DeviceFound';
			return;
		}
	}

	function configureChordInputs() {
		WebMidi.inputs.forEach((midiInput) => {
			// There are two conventions for note numbers, instead we use octave and offset within octave.
			midiInput.on('noteon', 'all', (note) => {
				console.log('chordOn', note);
				abcObj2.chord = addNote(note);
				const eq = chordEqual(abcObj1.chord, abcObj2.chord);
				if (eq == null) return; // chord2 has not 1 or 3 notes
				if (eq) {
					unEqual = false;

					success = true;
					if (tSucc != null) {
						clearTimeout(tSucc);
					}
					tSucc = setTimeout(() => {
						success = false;
					}, 300);

					if (tSound != null) {
						clearTimeout(tSound);
					}
					tSound = setTimeout(() => randomChord(), 500);
				} else {
					unEqual = true;
					if (tEqual != null) {
						clearTimeout(tEqual);
					}
					tEqual = setTimeout(() => (unEqual = false), 300);

					if (tSound != null) {
						clearTimeout(tSound);
					}
					tSound = setTimeout(() => playChord(abcObj1.chord), 300);
				}
			});
			midiInput.on('noteoff', 'all', (note) => {
				remNote(note);
			});
		});
	}

	function baseNote(key, clef, n) {
		// n = 0..11
		let b;
		let r = Math.random() < 0.5;
		if (clef == 'treble') b = n + (r ? 60 : 72);
		if (clef == 'bass') b = n + (r ? 60 - 24 : 60 - 12);
		if (key == 'minor') b -= 3;
		return b;
	}

	function prepareScales() {
		for (let mm of ['major', 'minor']) {
			let mdScales = {};
			midiScales[mm] = mdScales;
			let abScales = {};
			abcScales[mm] = abScales;
			const intervals = mm == 'major' ? majorIntervals : minorIntervals;
			for (let i = 0; i < 12; i++) {
				let key = keyLetterABC(i);
				let isSharp = accidentals[i] == '#';
				let mk = {};
				mk['up'] = {};
				mk['down'] = {};
				mdScales[key] = mk;
				let ak = {};
				ak['up'] = {};
				ak['down'] = {};
				abScales[key] = ak;
				for (let clef of ['bass', 'treble']) {
					let b = baseNote(mm, clef, i);
					mk['up'][clef] = [];
					mk['down'][clef] = [];
					for (let j = 0; j < 8; j++) {
						mk['up'][clef].push(b);
						mk['down'][clef].unshift(b);
						b += intervals[j];
					}
					ak['up'][clef] = noteLetterABC(mk['up'][clef], '', isSharp);
					ak['down'][clef] = noteLetterABC(mk['down'][clef], '', isSharp);
				}
			}
		}
		console.log('abcScales', abcScales);
		console.log('midiScales', midiScales);
	}

	function configureScaleInputs() {
		WebMidi.inputs.forEach((midiInput) => {
			// There are two conventions for note numbers, instead we use octave and offset within octave.
			midiInput.on('noteon', 'all', (note) => {
				let n = note.note.number;
				abcObj2.midiScale[abcObj2.pos] = n;
				if (abcObj1.midiScale[abcObj2.pos] == n) {
					abcObj2.pos += 1;
				} else {
					abcObj2.midiScale[abcObj2.pos] = n;
					unEqual = true;
					if (tEqual != null) {
						clearTimeout(tEqual);
					}
					tEqual = setTimeout(() => (unEqual = false), 300);

					if (tSound != null) {
						clearTimeout(tSound);
					}
					tSound = setTimeout(() => {
						playChord({ egal: abcObj1.midiScale[abcObj2.pos] });
					}, 300);
				}
				abcObj2.scale = noteLetterABC(abcObj2.midiScale, '', abcObj2.isSharp);
				if (abcObj2.pos == abcObj1.midiScale.length) {
					success = true;
					if (tSucc != null) {
						clearTimeout(tSucc);
					}
					tSucc = setTimeout(() => {
						success = false;
					}, 300);

					if (tSound != null) {
						clearTimeout(tSound);
					}
					tSound = setTimeout(() => {
						randomScale();
					}, 500);
				}
			});
			midiInput.on('noteoff', 'all', (note) => {});
		});
	}

	function includes(arr, elem) {
		for (let i = 0; i < arr.length; i++) {
			if (arr[i] == elem) return true;
		}
		return false;
	}

	function randomScale() {
		let mm = options.keys;
		if (mm == 'mixed') {
			mm = Math.random() < 0.5 ? 'major' : 'minor';
		}
		let keys = Object.keys(abcScales[mm]);
		let key;
		let isSharp;
		for (;;) {
			let n = getRndInteger(0, keys.length);
			isSharp = accidentals[n] == '#';
			key = keys[n];
			console.log('randomScale', key, lastKey, options);
			if (key == lastKey) continue;
			if (options.difficulty == 'easy' && !includes(easy, key)) continue;
			if (options.difficulty == 'medium' && !includes(medium, key)) continue;
			break;
		}
		lastKey = key;
		let dir = Math.random() < 0.5 ? 'up' : 'down';
		let clef = Math.random() < 0.5 ? 'treble' : 'bass';
		abcObj1.chord = null;
		abcObj1.key = key;
		abcObj1.scale = abcScales[mm][key][dir][clef];
		console.log('rc1', mm, key, dir, clef, abcObj1.scale);
		abcObj1.midiScale = midiScales[mm][key][dir][clef];
		abcObj1.clef = clef;

		abcObj2.chord = null;
		abcObj2.key = key;
		abcObj2.scale = ['z'];
		abcObj2.midiScale = [];
		abcObj2.clef = clef;
		abcObj2.isSharp = isSharp;
		abcObj2.pos = 0;
	}

	onMount(async () => {
		try {
			global.navigator = null;
		} catch (error) {} // Hack
		await WebMidi.disable();
		await initMidi();
		if (options.mode == 'scales') {
			prepareScales();
			configureScaleInputs();
			randomScale();
		} else {
			configureChordInputs();
			randomChord();
			abcObj2.chord = { '': 0 };
		}
	});

	onDestroy(async () => {
		try {
			global.navigator = null;
		} catch (error) {} // Hack
		await WebMidi.disable();
	});
</script>

<div class="flex w-full flex-col">
	{#if errorMessage}
		<h2>{errorMessage}</h2>
	{:else}
		<div class="mx-4 flex flex-col  items-center justify-center  lg:flex-row lg:justify-between">
			<div class:animate-wiggle={unEqual} class:animate-bounce={success}>
				<ABCChord name="oben" abcObj={abcObj1} />
			</div>
			<ABCChord name="unten" abcObj={abcObj2} />
		</div>
		<div class="mx-4">
			{#if options.mode != 'scales'}
				<div class="mt-4 flex">
					<p class="mr-4 w-20 flex-none">Keys</p>
					<div class="flex-1 bg-zinc-100 dark:bg-zinc-600">
						<p class="text-center">{chordOutput}</p>
					</div>
				</div>
			{/if}
		</div>
		<div class="mt-10 flex w-full justify-center">
			<button class="btn bg-secondary-500 text-primary-200" on:click={() => goto('/')}>
				Stop Drill!
			</button>
		</div>
	{/if}
</div>
