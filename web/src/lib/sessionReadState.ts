import type { SessionSummary } from '@/types/api'

const STORAGE_KEY = 'hapi-session-read-state'
const MAX_STORED_SESSIONS = 500

export type SessionReadState = Record<string, number>

function getSessionReadState(): SessionReadState {
    if (typeof window === 'undefined') {
        return {}
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) {
            return {}
        }
        const parsed = JSON.parse(stored)
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed as SessionReadState
        }
        return {}
    } catch {
        return {}
    }
}

function markSessionReadInState(state: SessionReadState, sessionId: string, updatedAt: number): SessionReadState {
    return {
        ...state,
        [sessionId]: updatedAt,
    }
}

function persistSessionReadState(state: SessionReadState): void {
    if (typeof window === 'undefined') {
        return
    }

    const entries = Object.entries(state)
    if (entries.length > MAX_STORED_SESSIONS) {
        entries.sort(([, a], [, b]) => b - a)
        const trimmed = entries.slice(0, MAX_STORED_SESSIONS)
        state = Object.fromEntries(trimmed)
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
        // Ignore storage errors
    }
}

function isSessionUnread(session: SessionSummary, readState: SessionReadState): boolean {
    if (!session.updatedAt) {
        return false
    }
    const lastReadTimestamp = readState[session.id]
    if (lastReadTimestamp === undefined) {
        return true
    }
    return session.updatedAt > lastReadTimestamp
}

export { getSessionReadState, markSessionReadInState, persistSessionReadState, isSessionUnread }
