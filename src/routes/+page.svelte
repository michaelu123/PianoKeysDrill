<script>
	import { WebMidi, Utilities } from 'webmidi/dist/esm/webmidi.esm.js';
	import { onMount } from 'svelte';
	import { options } from '$lib/options.js';
	import ABCChord from '$lib/ABCChord.svelte';
	// import SlideToggle from '@skeletonlabs/skeleton';
	import { SlideToggle, RangeSlider } from '@skeletonlabs/skeleton';

	let errorMessage = '';
	let midiIsReady = false;
	let _chord = {};
	let chord1;
	let chord2;
	const x = 6;
	let isSharp = true;
	let lastRandomChord = -1;
	let keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
	let key = 'C';

	$: chordOutput = chordKeys(chord2);

	function t(s) {
		return s;
	}

	function chordKeys(chord) {
		if (chord == null || chord.length == 0) return [''];
		// sort keys by increasing value (=note number)
		let keysSorted = Object.keys(chord).sort((a, b) => chord[a] - chord[b]);
		return keysSorted;
	}

	function addNote(note) {
		_chord[note.note.identifier] = note.note.number;
		console.log('add _chord', _chord);
		return _chord;
	}

	function remNote(note) {
		delete _chord[note.note.identifier];
		// console.log('rem _chord', _chord);
	}

	function chordEqual(chord1, chord2) {
		if (chord1 == null || chord2 == null) return false;
		let values1 = Object.values(chord1);
		let values2 = Object.values(chord2);
		if (values1.length != values2.length) return false;
		values1 = values1.sort();
		values2 = values2.sort();
		return values1.every((v, x) => v == values2[x]);
	}

	function getRndInteger(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}

	function randomChord() {
		let r;
		let id;
		const chords = options['chords'];
		let low = 33;
		let high = chords == 'none' ? 89 : 82; // so that we do not fold
		for (;;) {
			r = getRndInteger(low, high);
			if (r === lastRandomChord) continue;
			id = Utilities.toNoteIdentifier(r);
			if (!options['withAccidentals'] && id.length > 2) continue;
			break;
		}
		lastRandomChord = r;
		const c = {};
		c[id] = r;
		if (chords != 'none') {
			r += chords == 'major' ? 4 : 3;
			// if (r > 89) r -= 12; // fold
			id = Utilities.toNoteIdentifier(r);
			c[id] = r;
			r += chords == 'major' ? 3 : 4;
			// if (r > 89) r -= 12; // fold
			id = Utilities.toNoteIdentifier(r);
			c[id] = r;
		}
		isSharp = Math.random() < 0.5;
		playChord(c);
		return c;
	}

	function playChord(chord) {
		if (!options['sound']) return;
		WebMidi.outputs.forEach((midiOutput) => {
			console.log('playNote', chord, options['attack']);
			midiOutput.channels[1].playNote(Object.values(chord), {
				duration: 500,
				attack: options['attack'] / 100.0,
			});
		});
	}

	async function initMidi() {
		console.log('1init');
		await WebMidi.enable((error) => {
			console.log('2init', error);
			if (error) {
				console.log('3init', error);
				errorMessage = t('noMidiSupport');
				return;
			}
			if (WebMidi.inputs.length < 1) {
				console.log('4init', WebMidi.inputs);
				errorMessage = t('noDeviceFound');
				return;
			}
			WebMidi.inputs.forEach((midiInput) => {
				console.log('Using ', midiInput);
				// There are two conventions for note numbers, instead we use octave and offset within octave.
				midiInput.on('noteon', 'all', (note) => {
					console.log('noteon', note, note.note.identifier, note.note.number);
					chord2 = addNote(note);
					if (chordEqual(chord1, chord2)) {
						setTimeout(() => (chord1 = randomChord()), 500);
					} else {
						setTimeout(() => {
							playChord(chord1);
						}, 500);
					}
				});
				midiInput.on('noteoff', 'all', (note) => {
					remNote(note);
				});
			});
			midiIsReady = true;
		});
		console.log('5init');
	}

	function newChord() {
		setTimeout(() => {
			chord1 = randomChord();
			console.log('newChord', chord1);
		}, 200);
	}

	console.log('1test');
	onMount(async () => {
		console.log('2test');
		await initMidi();
		console.log('3test');
		chord1 = randomChord();
		chord2 = { '': 0 };
		console.log('4test');
	});
</script>

<div class="flex flex-col items-start justify-center">
	<ABCChord name="chord1" chord={chord1} {isSharp} {key} />
	<ABCChord name="chord2" chord={chord2} {isSharp} {key} />
	<div class="mt-5 grid grid-cols-2 gap-2">
		<p>Keys</p>
		<p>{chordOutput}</p>
		<p>Accidentals</p>
		<SlideToggle on:change={newChord} bind:checked={options['withAccidentals']} />
		<p>Sound</p>
		<SlideToggle bind:checked={options['sound']}>Sound</SlideToggle>
		<p>Attack</p>
		<RangeSlider bind:value={options['attack']} max={100} />
		<p>Chords?</p>
		<select class="h-8" on:change={newChord} bind:value={options['chords']}>
			<option value="none">None</option>
			<option value="major">Major</option>
			<option value="minor">Minor</option>
		</select>
	</div>

	<!-- <select class="form-select" bind:value={key}>
		{#each keys as key}
			<option value={key}>{key}</option>
		{/each}
	</select> -->
</div>
