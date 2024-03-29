// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type { Session } from '$lib/server/session';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
