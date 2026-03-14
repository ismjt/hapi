import type { Database } from 'bun:sqlite'

import type { StoredQuickCommand } from './types'

type DbQuickCommandRow = {
    id: string
    session_id: string
    text: string
    created_at: number
}

function toStoredQuickCommand(row: DbQuickCommandRow): StoredQuickCommand {
    return {
        id: row.id,
        sessionId: row.session_id,
        text: row.text,
        createdAt: row.created_at
    }
}

/**
 * 创建快捷命令
 */
export function createQuickCommand(
    db: Database,
    id: string,
    sessionId: string,
    text: string
): StoredQuickCommand {
    const now = Date.now()

    db.prepare(`
        INSERT INTO quick_commands (
            id, session_id, text, created_at
        ) VALUES (
            @id, @session_id, @text, @created_at
        )
    `).run({
        id,
        session_id: sessionId,
        text,
        created_at: now
    })

    const row = db.prepare('SELECT * FROM quick_commands WHERE id = ?').get(id) as DbQuickCommandRow | undefined
    if (!row) {
        throw new Error('Failed to create quick command')
    }
    return toStoredQuickCommand(row)
}

/**
 * 获取会话的所有快捷命令（按创建时间倒序）
 */
export function getQuickCommandsBySession(db: Database, sessionId: string): StoredQuickCommand[] {
    const rows = db.prepare(
        'SELECT * FROM quick_commands WHERE session_id = ? ORDER BY created_at DESC'
    ).all(sessionId) as DbQuickCommandRow[]
    return rows.map(toStoredQuickCommand)
}

/**
 * 删除快捷命令
 */
export function deleteQuickCommand(db: Database, id: string, sessionId: string): boolean {
    const result = db.prepare(
        'DELETE FROM quick_commands WHERE id = ? AND session_id = ?'
    ).run(id, sessionId)

    return result.changes > 0
}
