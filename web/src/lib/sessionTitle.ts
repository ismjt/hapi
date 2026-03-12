import type { Session, SessionSummary } from '@/types/api'

type SessionLike = Pick<Session, 'id' | 'metadata'> | Pick<SessionSummary, 'id' | 'metadata'>

/**
 * 获取会话标题
 * @param session 会话对象
 * @param opts 选项，allowGeneratedTitle 控制是否使用AI生成的标题（默认从会话metadata读取）
 * @returns 会话标题字符串
 */
export function getSessionTitle(
    session: SessionLike,
    opts: { allowGeneratedTitle?: boolean } = {}
): string {
    // 优先使用会话级别的设置，如果没有则使用传入的选项，默认为true
    const sessionSetting = session.metadata?.generatedTitleEnabled
    const allowGeneratedTitle = opts.allowGeneratedTitle ?? (sessionSetting ?? true)

    // 手动设置的名称优先级最高
    if (session.metadata?.name) {
        return session.metadata.name
    }
    // AI生成的摘要标题（当允许生成标题时）
    if (allowGeneratedTitle && session.metadata?.summary?.text) {
        return session.metadata.summary.text
    }
    // 从路径提取标题
    if (session.metadata?.path) {
        const parts = session.metadata.path.split('/').filter(Boolean)
        return parts.length > 0 ? parts[parts.length - 1] : session.id.slice(0, 8)
    }
    // 使用会话ID的前8位作为后备
    return session.id.slice(0, 8)
}
