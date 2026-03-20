import type { RawJSONLines } from '@/claude/types'

const VISIBLE_SYSTEM_SUBTYPES = new Set([
    'api_error',
    'turn_duration',
    'microcompact_boundary',
    'compact_boundary'
])

export function isClaudeChatVisibleMessage(message: Pick<RawJSONLines, 'type'> & { subtype?: string }): boolean {
    if (message.type !== 'system') {
        return true
    }

    return typeof message.subtype === 'string' && VISIBLE_SYSTEM_SUBTYPES.has(message.subtype)
}
