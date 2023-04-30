import { CLIENT_ID, REDIRECT_URI } from '$lib/server/constants';
import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import crypto from 'crypto';
import querystring from 'querystring';

// OpenID ConnectのAuthorization Endpointにリダイレクト
// cf. https://developers.google.com/identity/openid-connect/openid-connect?hl=ja#authenticationuriparameters
export const GET = (async ({ locals }) => {
	const state = crypto.randomBytes(8).toString('hex');
	const nonce = crypto.randomBytes(8).toString('hex');

	const q = querystring.encode({
		client_id: CLIENT_ID,
		scope: 'openid profile email',
		response_type: 'code',
		state,
		nonce,
		redirect_uri: REDIRECT_URI
	});
	const location = `https://accounts.google.com/o/oauth2/v2/auth?${q}`;

	locals.session.oauth_state = state;
	await locals.session.save();

	throw redirect(303, location);
}) satisfies RequestHandler;
