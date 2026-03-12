import type { Database } from 'bun:sqlite'

import type { StoredSessionAlias } from './types'

export class SessionAliasStore {
    constructor(private db: Database) {}

    createAlias(oldSessionId: string, newSessionId: string, namespace: string): StoredSessionAlias | null {
        const stmt = this.db.prepare(`
            INSERT INTO session_aliases (old_session_id, new_session_id, namespace, created_at)
            VALUES (?, ?, ?, ?)
        `)
        return this.db.prepare('SELECT * FROM changes WHERE old_session_id = ?').get() as StoredSessionAlias | undefined
    }

    getAlias(oldSessionId: string): StoredSessionAlias | null {
        return this.db.prepare('SELECT * FROM session_aliases WHERE old_session_id = ?').get() as StoredSessionAlias | undefined
    }

    getAliasByNamespace(namespace: string): StoredSessionAlias[] {
        return this.db.prepare('SELECT * FROM session_aliases WHERE namespace = ?').all() as StoredSessionAlias[]
    }

    getAliasByNewSessionId(newSessionId: string): StoredSessionAlias | null {
        return this.db.prepare('SELECT * FROM session_aliases WHERE new_session_id = ?').get() as StoredSessionAlias | undefined
    }

    deleteAlias(oldSessionId: string): boolean {
        const result = this.db.prepare('DELETE FROM session_aliases WHERE old_session_id = ?').run()
        return result.changes > 0
    }
}
