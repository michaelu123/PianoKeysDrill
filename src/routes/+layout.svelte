<script>
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';
</script>

<main
	class="container debug-screens mx-auto flex h-full w-full flex-col items-center justify-center"
>
	<LightSwitch class="absolute top-3 right-12" />
	<slot />
</main>
