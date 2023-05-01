import dynamoose from 'dynamoose';
import crypto from 'crypto';
import type { Item } from 'dynamoose/dist/Item';

// ログイン前のセッションを表す型とスキーマ
export interface PreloginSession extends Item {
	user_id?: undefined;
	session_id: string;
	ttl: number;
	oauth_state?: string;
	after_login_path?: string;
}

const preloginSessionSchema = new dynamoose.Schema({
	session_id: {
		type: String,
		hashKey: true
	},
	ttl: Number,
	oauth_state: String,
	after_login_path: String
});

// ログイン後のセッションを表す型とスキーマ
export interface LoginSession extends Item {
	user_id: string;
	session_id: string;
	ttl: number;
	email: string;
}

const loginSessionSchema = new dynamoose.Schema({
	session_id: {
		type: String,
		hashKey: true
	},
	ttl: Number,
	user_id: {
		type: String,
		index: {
			type: 'global'
		}
	},
	email: String
});

export type Session = PreloginSession | LoginSession;

// dynamodb localを使う設定。本番では別設定になるように分岐する必要がある
dynamoose.aws.ddb.local();

const Session = dynamoose.model<Session>('Session', [loginSessionSchema, preloginSessionSchema]);

// テーブルを作成する
new dynamoose.Table('login_sample_session', [Session], {
	expires: {
		ttl: 10 * 1000, // 作成から10秒後に期限切れ
		attribute: 'ttl',
		items: {
			returnExpired: false
		}
	}
});

export async function initSession(): Promise<PreloginSession> {
	const session_id = crypto.randomBytes(16).toString('hex');
	const session = new Session({ session_id });
	await session.save();
	return session as PreloginSession;
}

export async function findSession(session_id: string): Promise<Session | undefined> {
	const res = await Session.query('session_id').eq(session_id).exec();
	return res[0];
}

export async function login(
	session: Session,
	email: string,
	user_id: string
): Promise<LoginSession> {
	// セッション固定攻撃対策のためセッションIDを振りなおす
	const session_id = crypto.randomBytes(16).toString('hex');
	await session.delete();
	const newSession = new Session({ session_id, email, user_id });
	await newSession.save();
	return newSession as LoginSession;
}

export async function querySessionByUserID(user_id: string): Promise<Session[]> {
	return await Session.query('user_id').eq(user_id).using('user_idGlobalIndex').exec();
}
