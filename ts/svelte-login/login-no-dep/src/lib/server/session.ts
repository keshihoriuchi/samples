import dynamoose from 'dynamoose';
import crypto from 'crypto';
import type { Item } from 'dynamoose/dist/Item';

// dynamodb localを使う設定。本番では別設定になるように分岐する必要がある
dynamoose.aws.ddb.local();

export type Session =
	| {
			session_id: string;
			user_id?: string;
			oauth_state?: string;
			after_login_path?: string;
			email: string;
			ttl: number;
	  } & Item;

// ログイン後のセッションを表すスキーマ
const loginSessionSchema = new dynamoose.Schema({
	session_id: {
		type: String,
		hashKey: true
	},
	user_id: {
		type: String,
		index: {
			type: 'global'
		}
	},
	email: {
		type: String
	},
	ttl: {
		type: Number
	}
});

// ログイン前のセッションを表すスキーマ
const preloginSessionSchema = new dynamoose.Schema({
	session_id: {
		type: String,
		hashKey: true
	},
	oauth_state: {
		type: String
	},
	after_login_path: {
		type: String
	},
	ttl: {
		type: Number
	}
});

const SessionModel = dynamoose.model<Session>('Session', [
	loginSessionSchema,
	preloginSessionSchema
]);

const BASE_TTL = 10 * 1000; // 作成から10秒後に期限切れ

// テーブルを作成する
new dynamoose.Table('login_sample_session', [SessionModel], {
	expires: {
		ttl: BASE_TTL,
		attribute: 'ttl',
		items: {
			returnExpired: false
		}
	}
});

export async function findSession(session_id: string): Promise<Session | undefined> {
	const res = await SessionModel.query('session_id').eq(session_id).exec();
	return res[0];
}

export async function querySessionByUserID(user_id: string): Promise<Session[]> {
	return await SessionModel.query('user_id').eq(user_id).using('user_idGlobalIndex').exec();
}

export async function initSession(): Promise<Session> {
	const session_id = crypto.randomBytes(16).toString('hex');
	const session = new SessionModel({ session_id });
	await session.save();
	return session;
}

export async function login(session: Session, email: string, user_id: string): Promise<Session> {
	// セッション固定攻撃対策のためセッションIDを振りなおす
	const session_id = crypto.randomBytes(16).toString('hex');
	await session.delete();
	const newSession = new SessionModel({ session_id, email, user_id });
	await newSession.save();
	return newSession;
}
