import { describe, test, expect } from 'vitest';
import { initSession, login, findSession } from '$lib/server/session';
import { setTimeout } from 'timers/promises';

describe('Session', () => {
	test('initSession', async () => {
		const session = await initSession();
		expect(session.session_id).toBeTypeOf('string');
	});

	test('findSessionでsessionが見つかる', async () => {
		const session = await initSession();
		session.oauth_state = '1234';
		await session.save();
		const foundSession = await findSession(session.session_id);
		expect(foundSession?.oauth_state).toBe(session.oauth_state);
	});

	test('findSessionでsessionが見つからない', async () => {
		const foundSession = await findSession('invalid');
		expect(foundSession).toBe(undefined);
	});

	test('login', async () => {
		const session = await initSession();
		session.oauth_state = '1234';
		await session.save();

		const newSession = await login(session, 'abc@example.com', 'efg');
		expect(await findSession(session.session_id)).toBe(undefined);
		expect(newSession.session_id).not.toBe(session.session_id);
		expect(newSession.email).toBe('abc@example.com');
		expect(newSession.user_id).toBe('efg');
		expect(newSession.oauth_state).toBe(undefined);
	});

	test(
		'10秒後にセッションが消滅した扱いになる',
		async () => {
			const session = await initSession();
			await setTimeout(11 * 1000);

			const foundSession = await findSession(session.session_id);
			expect(foundSession).toBe(undefined);
		},
		15 * 1000
	);
});
