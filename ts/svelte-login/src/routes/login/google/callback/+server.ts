import { CLIENT_ID, CLIENT_SECRET, COOKIE_NAME, REDIRECT_URI } from '$lib/server/constants';
import { login } from '$lib/server/session';
import type { RequestHandler } from './$types';
import { error, redirect } from '@sveltejs/kit';
import querystring from 'querystring';
import { z } from 'zod';

const Claims = z.object({
	sub: z.string(),
	email: z.string(),
	email_verified: z.boolean()
});

type Claims = z.infer<typeof Claims>;

export const GET = (async ({ locals, url, cookies }) => {
	const session = locals.session;
	if (session.user_id !== undefined) {
		throw error(400, 'session state is invalid');
	}

	// パラメータの検証
	const code = url.searchParams.get('code');
	if (code === null) {
		throw error(400, 'code is required');
	}
	const state = url.searchParams.get('state');
	if (state === null || state !== session.oauth_state) {
		throw error(400, 'state is invalid');
	}

	// OpenID ConnectのToken Endpointにリクエスト
	const res = await fetch('https://www.googleapis.com/oauth2/v4/token', {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
		body: querystring.encode({
			client_id: CLIENT_ID,
			client_secret: CLIENT_SECRET,
			code,
			redirect_uri: REDIRECT_URI,
			grant_type: 'authorization_code'
		})
	});
	if (res.status !== 200) {
		throw error(400, 'failed to request token endpoint');
	}

	// レスポンスのJSONをパースしてIDトークンを取り出し、
	// さらにIDトークンのJWTをパースして認証情報(claims)を取得する。
	// JWTの正当性は検証していないがGoogleのTokenEndpointから直接取得したIDトークンであることが明らかなのでスキップできる。
	// (仮にIDトークンが不正だったとするとHTTPS通信の安全性が破綻しているなどのより深刻な問題を抱えていることになる)
	const jsonData = await res.json();
	const idToken = jsonData.id_token;
	const base64Str = idToken.split('.')[1];
	const decodedStr = Buffer.from(base64Str, 'base64').toString('utf-8');
	const claims = Claims.parse(JSON.parse(decodedStr));
	if (!claims.email_verified) {
		throw error(400, 'email is not verified');
	}

	// ログイン後にリダイレクトさせるURLの設定
	const afterLoginPath = session.after_login_path;
	const location = afterLoginPath !== undefined ? afterLoginPath : '/console';

	// ログイン前セッションを解除してログイン後セッションを設定する
	const newSession = await login(session, claims.email, claims.sub);
	locals.session = newSession;
	cookies.set(COOKIE_NAME, newSession.session_id, { path: '/' });

	throw redirect(303, location);
}) satisfies RequestHandler;
