import { self as sw } from '$app/service-worker';
import { immutable, assets, prerendered } from '$app/manifest';
import { version } from '$app/env';
import { asset, resolve } from '$app/paths';

// Makes the app work offline. Everything it needs is built into the page, so the whole
// app is cached when the worker installs and served from the cache afterwards.

// One cache per build: a new deployment installs its own cache and removes the old ones.
const PREFIX = 'vexel-';
const CACHE = PREFIX + version;

// The root of the app, with a trailing slash, correct even when it is served from a subpath.
// Manifest paths are relative to it.
const ROOT = resolve('');

const ASSETS = [
	...immutable.map((entry) => ROOT + entry.path),
	...assets.map((entry) => asset(entry.path)),
	...prerendered.map((entry) => resolve(entry.path))
];
const ASSET_PATHS = new Set(ASSETS);
const SHELL = resolve('/');

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)))
			)
	);
});

async function respond(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(CACHE);

	// Built files are immutable for this version, so the cache always wins. That includes
	// the page itself, which keeps the page and its scripts from the same build.
	if (ASSET_PATHS.has(url.pathname)) {
		const hit = await cache.match(url.pathname);
		if (hit) return hit;
	}

	try {
		return await fetch(request);
	} catch (err) {
		// Offline and not cached: any page address opens the app.
		if (request.mode === 'navigate') {
			const shell = await cache.match(SHELL);
			if (shell) return shell;
		}
		throw err;
	}
}

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;
	event.respondWith(respond(request, url));
});
