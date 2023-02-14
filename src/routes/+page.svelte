<script>
	import { WebMidi, Utilities } from 'webmidi';
	import { onMount, onDestroy } from 'svelte';
	import { options } from '$lib/options.js';
	import { SlideToggle, RangeSlider } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';

	function whiteKeysBetween(a, b) {
		let r = [];
		for (let i = a; i <= b; i++) {
			let n = Utilities.toNoteIdentifier(i);
			if (n.length <= 2) r.push(n);
		}
		return r;
	}
	let mins = whiteKeysBetween(33, 61);
	let maxs = whiteKeysBetween(72, 89);

	let errorMessage = '';

	function t(s) {
		return s;
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
		let midiOutput = null;
		WebMidi.outputs.forEach((mo) => {
			if (!mo.name.toLowerCase().includes('through')) midiOutput = mo; // How do I detect midi through channels?
		});
		if (midiOutput == null) {
			errorMessage = t('noMidi Output DeviceFound');
			return;
		}
	}

	onMount(async () => {
		await initMidi();
	});

	/* calling WebMidi.disable on this page causes a crash:
	file:///C:/Users/Michael/SvelteProjects/akkorde/node_modules/webmidi/dist/esm/webmidi.esm.js:12011
      if (navigator && typeof navigator.close === "function") navigator.close(); // jzz
      ^

	ReferenceError: navigator is not defined
    at file:///C:/Users/Michael/SvelteProjects/akkorde/node_modules/webmidi/dist/esm/webmidi.esm.js:12011:7
    at async eval (/src/routes/+page.svelte:70:3)
	It does not crash on the drill page, however!?
	onDestroy(async () => {
		await WebMidi.disable();
	});
	*/
</script>

<h1 class="mb-5">Piano Keys Drill</h1>
<img class="mb-10 w-60 flex-shrink" src="/favicon.png" alt="drill" />
<div class="flex w-full flex-col">
	{#if errorMessage}
		<h2>{errorMessage}</h2>
	{:else}
		<div class="mx-4">
			<div class="mt-4 flex">
				<p class="mr-4 w-20 flex-none">Sound</p>
				<SlideToggle class="flex-1" bind:checked={options.sound} />
			</div>
			<div class="mt-4 flex">
				<p class="mr-4 w-20">Attack</p>
				<RangeSlider class="flex-1" bind:value={options.attack} max={100} />
			</div>
			<div class="mt-4 flex">
				<p class="mr-4 w-20">Accidentals</p>
				<SlideToggle class="flex-1" bind:checked={options.withAccidentals} />
			</div>
			<div class="mt-4 flex">
				<p class="mr-4 w-20">Low Note</p>
				<select class="h-8 flex-1" bind:value={options.min}>
					{#each mins as min}
						<option value={min}>{min}</option>
					{/each}
				</select>
			</div>
			<div class="mt-4 flex">
				<p class="mr-4 w-20">High Note</p>
				<select class="h-8 flex-1" bind:value={options.max}>
					{#each maxs as max}
						<option value={max}>{max}</option>
					{/each}
				</select>
			</div>
			<div class="mt-4 flex">
				<p class="mr-4 w-20">Chords?</p>
				<select class="h-8 flex-1" bind:value={options.chords}>
					<option value="none">None</option>
					<option value="major">Major</option>
					<option value="minor">Minor</option>
					<option value="mixed">Mixed</option>
				</select>
			</div>
			{#if options['chords'] != 'none'}
				<div class="mt-4 flex">
					<p class="mr-4 w-20">Inversions</p>
					<SlideToggle class="flex-1" bind:checked={options.withInversions} />
				</div>
			{/if}
			<div class="mt-10 flex w-full justify-center">
				<button class="btn bg-secondary-500 text-primary-200" on:click={() => goto('/drill')}
					>Start Drill!</button
				>
			</div>
		</div>
	{/if}
</div>
