// run npm run preview,then copy sw.js from F12 / Application inspector
if (!self.define) {
	let e,
		l = {};
	const s = (s, i) => (
		(s = new URL(s + '.js', i).href),
		l[s] ||
			new Promise((l) => {
				if ('document' in self) {
					const e = document.createElement('script');
					(e.src = s), (e.onload = l), document.head.appendChild(e);
				} else (e = s), importScripts(s), l();
			}).then(() => {
				let e = l[s];
				if (!e) throw new Error(`Module ${s} didn’t register its module`);
				return e;
			})
	);
	self.define = (i, u) => {
		const n = e || ('document' in self ? document.currentScript.src : '') || location.href;
		if (l[n]) return;
		let r = {};
		const a = (e) => s(e, n),
			t = {
				module: {
					uri: n,
				},
				exports: r,
				require: a,
			};
		l[n] = Promise.all(i.map((e) => t[e] || a(e))).then((e) => (u(...e), r));
	};
}
define(['./workbox-3625d7b0'], function (e) {
	'use strict';
	self.skipWaiting(),
		e.clientsClaim(),
		e.precacheAndRoute(
			[
				{
					url: '_app/immutable/assets/_layout.611cd3ae.css',
					revision: null,
				},
				{
					url: '_app/immutable/assets/ProgressBar.39e0b86b.css',
					revision: null,
				},
				{
					url: '_app/immutable/assets/ReloadPrompt.f5028c6f.css',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/0.5a52805a.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/1.7419e132.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/2.e1b71f8b.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/3.6311a33b.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/index.2b4b215b.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/index.9a4a9877.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/preload-helper.41c905a7.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/ProgressBar.svelte_svelte_type_style_lang.775bd07a.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/ReloadPrompt.7ef6e82a.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/singletons.ce190ddb.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/utils.6239702c.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/virtual_pwa-register.5077c739.js',
					revision: null,
				},
				{
					url: '_app/immutable/chunks/workbox-window.prod.es5.295a6886.js',
					revision: null,
				},
				{
					url: '_app/immutable/entry/_error.svelte.b1a64ad6.js',
					revision: null,
				},
				{
					url: '_app/immutable/entry/_layout.svelte.810b563c.js',
					revision: null,
				},
				{
					url: '_app/immutable/entry/_page.svelte.2f4c0dcc.js',
					revision: null,
				},
				{
					url: '_app/immutable/entry/app.f3248136.js',
					revision: null,
				},
				{
					url: '_app/immutable/entry/drill-page.svelte.29a7c954.js',
					revision: null,
				},
				{
					url: '_app/immutable/entry/start.378cf42b.js',
					revision: null,
				},
				{
					url: 'favicon.png',
					revision: 'dd1318de245202f2673a2850c06d3029',
				},
				{
					url: 'manifest.webmanifest',
					revision: '60ed5dd43733bc1a6ae7ed84ebe35d94',
				},
			],
			{}
		),
		e.cleanupOutdatedCaches(),
		e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL('./')));
});
