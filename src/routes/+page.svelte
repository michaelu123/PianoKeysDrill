<script>
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { WebMidi } from 'webmidi/dist/esm/webmidi.esm.min.js';
	import { onMount } from 'svelte';
	import ABCChord from '$lib/ABCChord.svelte';

	let errorMessage = '';
	let midiIsReady = false;
	let _chord = {};
	let chord1, chord2;
	const x = 6;

	function t(s) {
		return s;
	}

	function addNote(note) {
		_chord[note.note.identifier] = note.note.number;
		console.log('add _chord', _chord);
		return _chord;
	}

	function remNote(note) {
		delete _chord[note.note.identifier];
		console.log('rem _chord', _chord);
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
					console.log('noteon', note.note.identifier, note.note.number);
					chord2 = addNote(note);
				});
				midiInput.on('noteoff', 'all', (note) => {
					console.log('noteoff', note.note.identifier);
					remNote(note);
				});
			});
			midiIsReady = true;
		});
		console.log('5init');
	}

	console.log('1test');
	onMount(async () => {
		await initMidi();
		chord1 = { C4: 60 };
	});
</script>

<main class="container debug-screens mx-auto flex h-full flex-col items-center justify-center">
	<LightSwitch class="absolute top-3 right-12" />
	<ABCChord name="chord1" chord={chord1} />
	<ABCChord name="chord2" chord={chord2} />
</main>
