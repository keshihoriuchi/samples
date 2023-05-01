import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
  if (locals.session.user_id === undefined) {
		throw error(400, 'session state is invalid');
	}

	return {
		user_id: locals.session.user_id,
		email: locals.session.email
	};
}) satisfies PageServerLoad;
