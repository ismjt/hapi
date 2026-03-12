import type { Database } from 'bun:sqlite'

import type { StoredSessionAlias } from './types'

type DbAliasRow = {
    old_session_id: string
    new_session_id: string
    namespace: string
    created_at: number
}

function toStoredAlias(row: DbAliasRow): StoredSessionAlias {
    return {
        oldSessionId: row.old_session_id,
        newSessionId: row.new_session_id,
        namespace: row.namespace,
        createdAt: row.created_at
    }
}

/**
 * 创建会话别名
 */
export function createAlias(
    db: Database,
    oldSessionId: string,
    newSessionId: string,
    namespace: string
): StoredSessionAlias | null {
    const now = Date.now()

    db.prepare(`
        INSERT INTO session_aliases (old_session_id, new_session_id, namespace, created_at)
        VALUES (?, ?, ?, ?)
    `).run(oldSessionId, newSessionId, namespace, now)

    return getAlias(db, oldSessionId)
}

/**
 * 获取会话别名
 */
export function getAlias(db: Database, oldSessionId: string): StoredSessionAlias | null {
    const row = db.prepare(
        'SELECT * FROM session_aliases WHERE old_session_id = ?'
    ).get(oldSessionId) as DbAliasRow | undefined
    return row ? toStoredAlias(row) : null
}

/**
 * 按命名空间获取会话别名列表
 */
export function getAliasByNamespace(db: Database, namespace: string): StoredSessionAlias[] {
    const rows = db.prepare(
        'SELECT * FROM session_aliases WHERE namespace = ?'
    ).all(namespace) as DbAliasRow[]
    return rows.map(toStoredAlias)
}

/**
 * 按新会话ID获取别名
 */
export function getAliasByNewSessionId(db: Database, newSessionId: string): StoredSessionAlias | null {
    const row = db.prepare(
        'SELECT * FROM session_aliases WHERE new_session_id = ?'
    ).get(newSessionId) as DbAliasRow | undefined
    return row ? toStoredAlias(row) : null
}

/**
 * 删除会话别名
 */
export function deleteAlias(db: Database, oldSessionId: string): boolean {
    const result = db.prepare(
        'DELETE FROM session_aliases WHERE old_session_id = ?'
    ).run(oldSessionId)

    return result.changes > 0
}
