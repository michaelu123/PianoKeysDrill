/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		require('path').join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		debugScreens: {
			position: ['top', 'left'],
			ignore: []
		},
		extend: {}
	},
	plugins: [
		require('tailwindcss-debug-screens'),
		require('@skeletonlabs/skeleton/tailwind/skeleton.cjs')
	]
};
