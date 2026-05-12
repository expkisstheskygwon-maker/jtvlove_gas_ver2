// functions/api/secret/_shared.ts
// 비밀대화(Secret DM) MVP 공통 유틸

type D1Database = any;

export interface Env {
  DB: D1Database;
}

export const JSON_HEADERS = { "Content-Type": "application/json" };

export const DEFAULT_PAID_MESSAGE_COST = 50;

export function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function ensureSecretTables(env: Env) {
  // NOTE: 기존 코드베이스가 "요청 시 자동 마이그레이션" 패턴을 쓰고 있어서 동일하게 맞춥니다.
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS secret_conversations (
      id TEXT PRIMARY KEY,
      fan_id TEXT NOT NULL,
      cca_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_message_at DATETIME,
      UNIQUE(fan_id, cca_id)
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS secret_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_paid INTEGER DEFAULT 0,
      price_points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME
    )
  `).run();

  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_secret_messages_conv_created ON secret_messages(conversation_id, created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_secret_messages_conv_unread ON secret_messages(conversation_id, read_at)`).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS secret_blocks (
      id TEXT PRIMARY KEY,
      cca_id TEXT NOT NULL,
      fan_id TEXT NOT NULL,
      status TEXT DEFAULT 'blocked',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(cca_id, fan_id)
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS cca_earning_logs (
      id TEXT PRIMARY KEY,
      cca_id TEXT NOT NULL,
      amount_points INTEGER NOT NULL,
      source_message_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // paid_message_cost 컬럼이 없을 수 있어, 사용 시 자동으로 추가 시도
  try {
    await env.DB.prepare(`ALTER TABLE ccas ADD COLUMN paid_message_cost INTEGER DEFAULT 0`).run();
  } catch {}
}

export async function detectRole(env: Env, userId: string): Promise<'cca' | 'user'> {
  const isCca = await env.DB.prepare("SELECT 1 FROM ccas WHERE id = ?").bind(userId).first();
  return isCca ? 'cca' : 'user';
}

