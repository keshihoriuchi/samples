import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	return {
		user_id: locals.session.user_id,
		email: locals.session.email
	};
}) satisfies PageServerLoad;
