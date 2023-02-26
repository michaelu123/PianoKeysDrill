<script>
	import { WebMidi, Utilities } from 'webmidi';
	import { onDestroy, onMount } from 'svelte';
	import { options } from '$lib/options.js';
	import ABCChord from '$lib/ABCChord.svelte';
	import { Chord } from '$lib/music21j/chord';
	import { goto } from '$app/navigation';
	import { noteLetterABC, keyLettersABC, getAccidental, min2maj } from '$lib/utils.js';

	let errorMessage = '';
	let midiOutput = null;
	let _chord = {};
	let unEqual = false;
	let success = false;
	let lastRandomChordBase = -1;
	let lastRandomScaleBase = -1;
	let tEqual = null;
	let tSound = null;
	let tSucc = null;
	let abcObj1 = { scale: null, midiScale: null, chord: null };
	let abcObj2 = { scale: null, midiScale: null, chord: null, pos: 0 };
	let lowNote = 'A1';
	let highNote = 'E6';
	let scaleKey = '';
	let repeat = false;

	// scales stuff

	// major scales fingering
	const fingeringsUpCR = [1, 2, 3, 1, 2, 3, 4, 1]; // C,G,D,A,E,B
	const fingeringsUpFR = [1, 2, 3, 4, 1, 2, 3, 1]; // F
	const fingeringsUpFsR = [2, 3, 4, 1, 2, 3, 1, 2]; // F#/Gb
	const fingeringsUpBbR = [2, 1, 2, 3, 1, 2, 3, 4]; // Bb
	const fingeringsUpEbR = [2, 1, 2, 3, 4, 1, 2, 3]; // Eb
	const fingeringsUpAbR = [2, 3, 1, 2, 3, 4, 1, 2]; // Ab
	const fingeringsUpDbR = [2, 3, 1, 2, 3, 4, 1, 2]; // Db

	const fingeringsUpCL = [5, 4, 3, 2, 1, 3, 2, 1]; // C,G,D,A,E,F
	const fingeringsUpBL = [4, 3, 2, 1, 4, 3, 2, 1]; // B
	const fingeringsUpFsL = [4, 3, 2, 1, 3, 2, 1, 4]; // F#/Gb
	const fingeringsUpBbL = [3, 2, 1, 4, 3, 2, 1, 3]; // Bb, Eb, Ab,Db

	const fingeringsDownCR = [5, 4, 3, 2, 1, 3, 2, 1]; // C,G,D,A,E,B
	const fingeringsDownFR = [4, 3, 2, 1, 4, 3, 2, 1]; // F,
	const fingeringsDownBbR = [4, 3, 2, 1, 3, 2, 1, 4]; // Bb
	const fingeringsDownEbR = [2, 1, 4, 3, 2, 1, 3, 2]; // Eb,Ab,Db
	const fingeringsDownFsR = [2, 1, 3, 2, 1, 4, 3, 2]; // F#/Gb

	const fingeringsDownCL = [1, 2, 3, 1, 2, 3, 4, 1]; // C,G,D,A,E,F
	const fingeringsDownBL = [1, 2, 3, 4, 1, 2, 3, 1]; // B
	const fingeringsDownBbL = [2, 1, 2, 3, 4, 1, 2, 3]; // Bb,Eb,Ab,Db
	const fingeringsDownGbL = [2, 1, 2, 3, 1, 2, 3, 4]; // F#/Gb

	const fingerings = {
		major: {
			upRight: {
				C: fingeringsUpCR,
				G: fingeringsUpCR,
				D: fingeringsUpCR,
				A: fingeringsUpCR,
				E: fingeringsUpCR,
				B: fingeringsUpCR,
				'F#': fingeringsUpFsR,
				Gb: fingeringsUpFsR,
				Db: fingeringsUpDbR,
				Ab: fingeringsUpAbR,
				Eb: fingeringsUpEbR,
				Bb: fingeringsUpBbR,
				F: fingeringsUpFR,
			},
			upLeft: {
				C: fingeringsUpCL,
				G: fingeringsUpCL,
				D: fingeringsUpCL,
				A: fingeringsUpCL,
				E: fingeringsUpCL,
				B: fingeringsUpBL,
				'F#': fingeringsUpFsL,
				Gb: fingeringsUpFsL,
				Db: fingeringsUpBbL,
				Ab: fingeringsUpBbL,
				Eb: fingeringsUpBbL,
				Bb: fingeringsUpBbL,
				F: fingeringsUpCL,
			},
			downRight: {
				C: fingeringsDownCR,
				G: fingeringsDownCR,
				D: fingeringsDownCR,
				A: fingeringsDownCR,
				E: fingeringsDownCR,
				B: fingeringsDownCR,
				'F#': fingeringsDownFsR,
				Gb: fingeringsDownCR,
				Db: fingeringsDownEbR,
				Ab: fingeringsDownEbR,
				Eb: fingeringsDownEbR,
				Bb: fingeringsDownBbR,
				F: fingeringsDownFR,
			},
			downLeft: {
				C: fingeringsDownCL,
				G: fingeringsDownCL,
				D: fingeringsDownCL,
				A: fingeringsDownCL,
				E: fingeringsDownCL,
				B: fingeringsDownBL,
				'F#': fingeringsDownGbL,
				Gb: fingeringsDownGbL,
				Db: fingeringsDownBbL,
				Ab: fingeringsDownBbL,
				Eb: fingeringsDownBbL,
				Bb: fingeringsDownBbL,
				F: fingeringsDownCL,
			},
		},
		minor: {
			upRight: {
				C: null,
				G: null,
				D: null,
				A: null,
				E: null,
				B: null,
				'F#': null,
				Gb: null,
				Db: null,
				Ab: null,
				Eb: null,
				Bb: null,
				F: null,
			},
			upLeft: {
				C: null,
				G: null,
				D: null,
				A: null,
				E: null,
				B: null,
				'F#': null,
				Gb: null,
				Db: null,
				Ab: null,
				Eb: null,
				Bb: null,
				F: null,
			},
			downRight: {
				C: null,
				G: null,
				D: null,
				A: null,
				E: null,
				B: null,
				'F#': null,
				Gb: null,
				Db: null,
				Ab: null,
				Eb: null,
				Bb: null,
				F: null,
			},
			downLeft: {
				C: null,
				G: null,
				D: null,
				A: null,
				E: null,
				B: null,
				'F#': null,
				Gb: null,
				Db: null,
				Ab: null,
				Eb: null,
				Bb: null,
				F: null,
			},
		},
	};

	const majorIntervals = [2, 2, 1, 2, 2, 2, 1, 0];
	const minorIntervals = [2, 1, 2, 2, 1, 2, 2, 0];

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
		let mode = options.mode;
		let keys = options.keys;
		let high = mode == 'keys' ? highNote : highNote - 7; // so that we do not fold
		let r;
		for (;;) {
			r = getRndInteger(lowNote, high);
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

	function baseNote(key, n) {
		// n = 0..12
		if (n >= 7) n -= 1; // F#,Gb
		// n = 0..11
		if (key == 'minor') n += 12 - 3;
		return n % 12;
	}

	function prepareMidiScales() {
		for (let mm of ['major', 'minor']) {
			let mdScales = {};
			midiScales[mm] = mdScales;
			const intervals = mm == 'major' ? majorIntervals : minorIntervals;
			for (let i = 0; i < 13; i++) {
				let key = keyLettersABC()[i];
				let mk = [];
				mdScales[key] = mk;
				let b = baseNote(mm, i);
				for (let j = 0; j < 8; j++) {
					mk.push(b);
					b += intervals[j];
				}
			}
		}
		console.log('midiScales', midiScales);
	}

	function configureScaleInputs() {
		WebMidi.inputs.forEach((midiInput) => {
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
				abcObj2.scale = noteLetterABC(abcObj2.midiScale, '', abcObj2.isSharp, null);
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

	// In the menu we want to show minor scales as a,e,d... different from major C,G,F
	// but abcjs requires major scale names for the K letter, that shows the b's or #'s.
	// I.e. K a for a minor will not work, you must say K C.
	function randomScale() {
		if (!repeat) {
			let mm = options.keys;
			if (mm == 'mixed') {
				mm = Math.random() < 0.5 ? 'major' : 'minor';
			}

			let r;
			for (;;) {
				r = getRndInteger(0, options.scales.length);
				if (r === lastRandomScaleBase) continue;
				break;
			}
			lastRandomScaleBase = r;
			let key = options.scales[r];
			scaleKey = key;
			if (key[0] >= 'a' && key[0] <= 'g') key = min2maj(key); // a -> C
			let isSharp = getAccidental(key) == '#';
			let dir = Math.random() < 0.5 ? 'up' : 'down';
			let clef = Math.random() < 0.5 ? 'treble' : 'bass';
			let midiScale = midiScales[mm][key];

			let l = midiScale[0]; // l = note number of key qua construction
			// we want to have our octave somewhere between lowNote and highNote,
			// and higher than C4-x for treble and lower than C4+x for bass
			let possible = [];
			let x = 6;
			if (clef == 'treble') {
				while (l < 60 - x && n < lowNote) l += 12;
				while (l + 12 < highNote) {
					possible.push(l);
					l += 12;
				}
			}
			if (clef == 'bass') {
				while (l < lowNote) l += 12;
				while (l + 12 <= 60 + x && l < highNote) {
					possible.push(l);
					l += 12;
				}
			}
			let mdArr = [];
			let off = 0;
			if (possible.length == 0) {
				// impossible between lowNote, highNote
				off = clef == 'treble' ? 60 : 36; // start above C4 or C2
			} else if (possible.length == 1) {
				off = possible[0]; // there is no alternative!
			} else {
				off = possible[getRndInteger(0, possible.length)];
			}
			off -= midiScale[0];
			console.log('off', off);
			if (dir == 'up') {
				for (let i = 0; i < 8; i++) {
					mdArr.push(midiScale[i] + off);
				}
			} else {
				for (let i = 0; i < 8; i++) {
					mdArr.unshift(midiScale[i] + off);
				}
			}
			console.log('mdArr', mdArr);

			let fingering = null;
			if (options.withFingering) {
				let fingerDir;
				if (dir == 'up') {
					fingerDir = clef == 'treble' ? 'upRight' : 'upLeft';
				} else {
					fingerDir = clef == 'treble' ? 'downRight' : 'downLeft';
				}
				fingering = fingerings[mm][fingerDir][key];
			}

			abcObj1.chord = null;
			abcObj1.key = key;
			abcObj1.midiScale = mdArr;
			abcObj1.clef = clef;
			abcObj1.isSharp = isSharp;
			abcObj1.scale = noteLetterABC(mdArr, '', isSharp, fingering);
			console.log('rc1', mm, key, dir, clef, abcObj1.scale, fingering);
			repeat = options.repeat;
		}
		abcObj2.chord = null;
		abcObj2.key = abcObj1.key;
		abcObj2.scale = ['z'];
		abcObj2.midiScale = [];
		abcObj2.clef = abcObj1.clef;
		abcObj2.isSharp = abcObj1.isSharp;
		abcObj2.pos = 0;
	}

	onMount(async () => {
		try {
			global.navigator = null;
		} catch (error) {} // Hack
		await WebMidi.disable();
		await initMidi();

		lowNote = Utilities.toNoteNumber(options.min);
		highNote = Utilities.toNoteNumber(options.max) + 1;

		if (options.mode == 'scales') {
			prepareMidiScales();
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
			{#if options.mode == 'scales'}
				<div class="mt-4 flex">
					<p class="mr-4 w-20 flex-none">Scale</p>
					<div class="flex-1 bg-zinc-100 dark:bg-zinc-600">
						<p class="text-center">{scaleKey}</p>
					</div>
				</div>
			{:else}
				<div class="mt-4 flex">
					<p class="mr-4 w-20 flex-none">Keys</p>
					<div class="flex-1 bg-zinc-100 dark:bg-zinc-600">
						<p class="text-center">{chordOutput}</p>
					</div>
				</div>
			{/if}
		</div>
		<div class="mt-10 flex w-full justify-around">
			<button class="btn bg-secondary-500 text-primary-200" on:click={() => goto('/')}>
				Stop Drill!
			</button>
			{#if options.repeat}
				<button
					class="btn bg-secondary-500 text-primary-200"
					on:click={() => {
						repeat = false;
						randomScale();
					}}
				>
					Next Scale
				</button>
			{/if}
		</div>
	{/if}
</div>
