<script>
	import { page } from '$app/stores';
	export let form;
	export let data;
	function doNothing() {
		console.log(form, data);
	}
</script>

<h1>Error {$page.status}: {$page.error.message}</h1>
