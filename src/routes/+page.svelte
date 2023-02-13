<script>
	import { WebMidi, Utilities } from 'webmidi';
	import { onMount } from 'svelte';
	import { options } from '$lib/options.js';
	import ABCChord from '$lib/ABCChord.svelte';
	import { Chord } from '$lib/music21j/chord';
	import { SlideToggle, RangeSlider } from '@skeletonlabs/skeleton';

	let errorMessage = '';
	let midiIsReady = false;
	let midiOutput = null;
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
		if (chord == null || chord.length == 0 || chord[''] == 0) return [''];
		// sort keys by increasing value (=note number)
		let keysSorted = Object.keys(chord).sort((a, b) => chord[a] - chord[b]);
		let m21Chord = new Chord(keysSorted);
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
		const chords = options['chords'];
		let low = 33;
		let high = chords == 'none' ? 89 : 82; // so that we do not fold
		for (;;) {
			r = getRndInteger(low, high);
			if (r === lastRandomChord) continue;
			let id = Utilities.toNoteIdentifier(r);
			if (!options['withAccidentals'] && id.length > 2) continue;
			break;
		}
		lastRandomChord = r;
		let notes;
		if (chords == 'none') {
			notes = [r];
		} else if (chords == 'major') {
			notes = [r, r + 4, r + 7];
		} else {
			notes = [r, r + 3, r + 7];
		}
		if (chords != 'none' && options['withInversions']) {
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
		isSharp = Math.random() < 0.5;
		playChord(c, 'X1');
		return c;
	}

	function playChord(chord, m) {
		if (!options['sound']) return;
		midiOutput.channels[1].playNote(Object.values(chord), {
			duration: 500,
			attack: options['attack'] / 100.0,
		});
	}

	async function initMidi() {
		await WebMidi.enable((error) => {
			if (error) {
				console.log('Webmidi error', error);
				errorMessage = t('noMidiSupport');
				return;
			}
		});
		if (WebMidi.inputs.length < 1) {
			errorMessage = t('noMidi Input DeviceFound');
			return;
		}
		midiOutput = null;
		WebMidi.outputs.forEach((mo) => {
			if (!mo.name.toLowerCase().includes('through')) midiOutput = mo; // How do I detect midi through channels?
		});
		if (midiOutput == null) {
			errorMessage = t('noMidi Output DeviceFound');
			return;
		}
		WebMidi.inputs.forEach((midiInput) => {
			// There are two conventions for note numbers, instead we use octave and offset within octave.
			midiInput.on('noteon', 'all', (note) => {
				chord2 = addNote(note);
				if (chordEqual(chord1, chord2)) {
					setTimeout(() => (chord1 = randomChord()), 500);
				} else {
					setTimeout(() => {
						playChord(chord1, 'X2');
					}, 500);
				}
			});
			midiInput.on('noteoff', 'all', (note) => {
				remNote(note);
			});
		});
		midiIsReady = true;
	}

	function newChord() {
		setTimeout(() => {
			chord1 = randomChord();
		}, 200);
	}

	onMount(async () => {
		await initMidi();
		chord1 = randomChord();
		chord2 = { '': 0 };
	});
</script>

<div class="flex w-full flex-col">
	{#if errorMessage}
		<h2>{errorMessage}</h2>
	{:else}
		<div class="mx-4 flex flex-col items-center justify-center">
			<ABCChord name="chord1" chord={chord1} {isSharp} {key} />
			<ABCChord name="chord2" chord={chord2} {isSharp} {key} />
		</div>
		<!-- <div class="mt-5 grid grid-cols-2 gap-3">
			<p class="w-20 bg-red-100">Keys</p>
			<div class="w-auto bg-zinc-100 dark:bg-zinc-600">
				<p class="text-center">{chordOutput}</p>
			</div>
			<p class="w-20">Sound</p>
			<SlideToggle bind:checked={options['sound']} />
			<p class="w-20">Attack</p>
			<RangeSlider bind:value={options['attack']} max={100} />
			<p class="w-20">Accidentals</p>
			<SlideToggle on:change={newChord} bind:checked={options['withAccidentals']} />
			<p class="w-20">Chords?</p>
			<select class="h-8" on:change={newChord} bind:value={options['chords']}>
				<option value="none">None</option>
				<option value="major">Major</option>
				<option value="minor">Minor</option>
			</select>
			{#if options['chords'] != 'none'}
				<p class="w-20">Inversions</p>
				<SlideToggle on:change={newChord} bind:checked={options['withInversions']} />
			{/if}
		</div> -->
		<div class="mx-4">
			<div class="mt-4 flex">
				<p class="mr-4 w-20 flex-none">Keys</p>
				<div class="flex-1 bg-zinc-100 dark:bg-zinc-600">
					<p class="text-center">{chordOutput}</p>
				</div>
			</div>
			<div class="mt-4 flex">
				<p class="mr-4 w-20 flex-none">Sound</p>
				<SlideToggle class="flex-1" bind:checked={options['sound']} />
			</div>
			<div class="mt-4 flex">
				<p class="mr-4 w-20">Attack</p>
				<RangeSlider class="flex-1" bind:value={options['attack']} max={100} />
			</div>
			<div class="mt-4 flex">
				<p class="mr-4 w-20">Accidentals</p>
				<SlideToggle
					class="flex-1"
					on:change={newChord}
					bind:checked={options['withAccidentals']}
				/>
			</div>
			<div class="mt-4 flex">
				<p class="mr-4 w-20">Chords?</p>
				<select class="h-8 flex-1" on:change={newChord} bind:value={options['chords']}>
					<option value="none">None</option>
					<option value="major">Major</option>
					<option value="minor">Minor</option>
				</select>
			</div>
			{#if options['chords'] != 'none'}
				<div class="mt-4 flex">
					<p class="mr-4 w-20">Inversions</p>
					<SlideToggle
						class="flex-1"
						on:change={newChord}
						bind:checked={options['withInversions']}
					/>
				</div>
			{/if}
		</div>
	{/if}

	<!-- <select class="form-select" bind:value={key}>
		{#each keys as key}
			<option value={key}>{key}</option>
		{/each}
	</select> -->
</div>
