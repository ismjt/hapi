import type { Database } from 'bun:sqlite'

import type { StoredQuickCommand } from './types'
import {
    createQuickCommand,
    deleteQuickCommand,
    getQuickCommandsBySession
} from './quickCommands'

const LOG_PREFIX = '[QuickCommandStore]'

export class QuickCommandStore {
    private readonly db: Database

    constructor(db: Database) {
        this.db = db
        this.ensureTableExists()
    }

    private ensureTableExists(): void {
        // 检查表是否存在，如果不存在则创建（向后兼容旧版本数据库）
        const tableExists = this.db.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='quick_commands'"
        ).get() as { name?: string } | undefined

        if (!tableExists) {
            console.log(`${LOG_PREFIX} Table quick_commands does not exist, creating...`)
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS quick_commands (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    text TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_quick_commands_session_id ON quick_commands(session_id);
                CREATE INDEX IF NOT EXISTS idx_quick_commands_created_at ON quick_commands(created_at);
            `)
            console.log(`${LOG_PREFIX} Table quick_commands created successfully`)
        } else {
            console.log(`${LOG_PREFIX} Table quick_commands exists`)
        }
    }

    createQuickCommand(sessionId: string, text: string): StoredQuickCommand {
        console.log(`${LOG_PREFIX} createQuickCommand: session=${sessionId}, text="${text}"`)
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`
        const result = createQuickCommand(this.db, id, sessionId, text)
        console.log(`${LOG_PREFIX} createQuickCommand: created with id=${id}`)
        return result
    }

    getQuickCommandsBySession(sessionId: string): StoredQuickCommand[] {
        console.log(`${LOG_PREFIX} getQuickCommandsBySession: session=${sessionId}`)
        const result = getQuickCommandsBySession(this.db, sessionId)
        console.log(`${LOG_PREFIX} getQuickCommandsBySession: found ${result.length} commands`)
        return result
    }

    deleteQuickCommand(id: string, sessionId: string): boolean {
        console.log(`${LOG_PREFIX} deleteQuickCommand: id=${id}, session=${sessionId}`)
        const result = deleteQuickCommand(this.db, id, sessionId)
        console.log(`${LOG_PREFIX} deleteQuickCommand: deleted=${result}`)
        return result
    }

    deleteBySession(sessionId: string): number {
        const result = this.db.prepare(
            'DELETE FROM quick_commands WHERE session_id = ?'
        ).run(sessionId)
        return result.changes
    }
}
