<script>
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';

	import { onMount } from 'svelte';
	console.log('0aonmount');
	import { pwaInfo } from 'virtual:pwa-info';
	console.log('0bonmount', pwaInfo);

	let ReloadPrompt;

	onMount(async () => {
		console.log('1onmount', pwaInfo);
		if (pwaInfo) {
			console.log('2onmount');
			const { registerSW } = await import('virtual:pwa-register');
			console.log('3onmount');
			registerSW({
				immediate: true,
				onRegistered(r) {
					// uncomment following code if you want check for updates
					// r && setInterval(() => {
					//    console.log('Checking for sw update')
					//    r.update()
					// }, 20000 /* 20s for testing purposes */)
					console.log(`SW Registered: ${r}`);
				},
				onRegisterError(error) {
					console.log('SW registration error', error);
				},
			});
			console.log('4onmount');
			ReloadPrompt = (await import('$lib/ReloadPrompt.svelte')).default;
			console.log('5onmount');
		}
		console.log('6onmount');
	});

	$: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
	{@html webManifest}
</svelte:head>

<main
	class="container debug-screens mx-auto flex h-full w-full flex-col items-center justify-center"
>
	<LightSwitch class="absolute top-3 right-12" />
	<slot />
</main>

{#if ReloadPrompt}
	<svelte:component this={ReloadPrompt} />
{/if}
