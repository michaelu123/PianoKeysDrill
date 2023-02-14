/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		require('path').join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}'),
	],
	theme: {
		debugScreens: {
			position: ['top', 'left'],
			ignore: [],
		},
		extend: {
			animation: {
				wiggle: 'wiggle 10ms ease-in-out infinite',
			},
			keyframes: {
				wiggle: {
					'0%, 100%': {
						transform: 'rotate(-12deg)',
					},
					'50%': { transform: 'rotate(12deg)' },
				},
			},
		},
	},
	plugins: [
		require('tailwindcss-debug-screens'),
		require('@skeletonlabs/skeleton/tailwind/skeleton.cjs'),
	],
};
