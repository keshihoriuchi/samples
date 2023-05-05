import { COOKIE_NAME } from '$lib/server/constants';
import { findSession, initSession } from '$lib/server/session';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
	const sessionID = event.cookies.get(COOKIE_NAME);
	let session = undefined;
	if (sessionID === undefined) {
		session = await initSession();
		event.cookies.set(COOKIE_NAME, session.session_id, { path: '/' });
	} else {
		session = await findSession(sessionID);
		// 有効期限が切れていて消滅したか、何らかの不正な設定がされていた場合、undefined
		if (session === undefined) {
			session = await initSession();
			event.cookies.set(COOKIE_NAME, session.session_id, { path: '/' });
		}
	}
	event.locals.session = session;

	const pathname = event.url.pathname;
	if (session.user_id !== undefined) {
		// 認証に成功しており認証時はアクセスする必要がないパスの場合リダイレクトする
		if (pathname === '/' || pathname.startsWith('/login')) {
			throw redirect(303, '/console');
		}
	} else {
		// 認証が必要なパスで認証情報が存在しない場合リダイレクトする
		if (pathname.startsWith('/console')) {
			session.after_login_path = pathname;
			await session.save();
			throw redirect(303, '/');
		}
	}

	return await resolve(event);
}) satisfies Handle;
