import type { Database } from 'bun:sqlite'

import type { StoredSessionAlias } from './types'
import { createAlias, getAlias, getAliasByNamespace, getAliasByNewSessionId, deleteAlias } from './sessionAlias'

export class SessionAliasStore {
    private readonly db: Database

    constructor(db: Database) {
        this.db = db
    }

    createAlias(oldSessionId: string, newSessionId: string, namespace: string): StoredSessionAlias | null {
        return createAlias(this.db, oldSessionId, newSessionId, namespace)
    }

    getAlias(oldSessionId: string): StoredSessionAlias | null {
        return getAlias(this.db, oldSessionId)
    }

    getAliasByNamespace(namespace: string): StoredSessionAlias[] {
        return getAliasByNamespace(this.db, namespace)
    }

    getAliasByNewSessionId(newSessionId: string): StoredSessionAlias | null {
        return getAliasByNewSessionId(this.db, newSessionId)
    }

    deleteAlias(oldSessionId: string): boolean {
        return deleteAlias(this.db, oldSessionId)
    }
}
