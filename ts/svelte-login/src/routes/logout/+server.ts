import type { RequestHandler } from './$types';
import { initSession } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';
import { COOKIE_NAME } from '$lib/server/constants';

export const GET = (async ({ cookies, locals }) => {
	await locals.session.delete();
	locals.session = await initSession();
	cookies.set(COOKIE_NAME, locals.session.session_id, { path: '/' });
	throw redirect(303, '/');
}) satisfies RequestHandler;
