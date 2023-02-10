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

	$: chordOutput = chordKeys(chord2);

	function t(s) {
		return s;
	}

	function chordKeys(chord) {
		if (chord == null) return 'C4';
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
		do {
			r = getRndInteger(33, 89);
		} while (r === lastRandomChord);
		lastRandomChord = r;
		const id = Utilities.toNoteIdentifier(r);
		const c = {};
		c[id] = r;
		console.log('randChord', c, r, id);
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

	console.log('1test');
	onMount(async () => {
		console.log('2test');
		await initMidi();
		console.log('3test');
		chord1 = randomChord();
		chord2 = { C4: 60 };
		console.log('4test');
	});
</script>

<div class="flex flex-col items-center justify-center">
	<SlideToggle bind:checked={options['sound']}>Sound</SlideToggle>
	<RangeSlider class="mt-10" bind:value={options['attack']} max={100}>Attack</RangeSlider>
	<ABCChord name="chord1" chord={chord1} {isSharp} />
	<ABCChord name="chord2" chord={chord2} {isSharp} />
	<div class="w-fit rounded bg-slate-400 p-4">
		<p>{chordOutput}</p>
	</div>
</div>
