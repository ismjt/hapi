import { MessagePrimitive, useAssistantState } from '@assistant-ui/react'
import { LazyRainbowText } from '@/components/LazyRainbowText'
import { useHappyChatContext } from '@/components/AssistantChat/context'
import type { HappyChatMessageMetadata } from '@/lib/assistant-runtime'
import { MessageStatusIndicator } from '@/components/AssistantChat/messages/MessageStatusIndicator'
import { MessageAttachments } from '@/components/AssistantChat/messages/MessageAttachments'
import { CliOutputBlock } from '@/components/CliOutputBlock'
import { useTranslation } from '@/lib/use-translation'
import { useCallback, useMemo } from 'react'

// 格式化时间为 yyyy-mm-dd HH:mm:ss
function formatDateTime(date: Date | number): string {
    const d = typeof date === 'number' ? new Date(date) : date
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function HappyUserMessage() {
    const ctx = useHappyChatContext()
    const { t } = useTranslation()
    const role = useAssistantState(({ message }) => message.role)
    const text = useAssistantState(({ message }) => {
        if (message.role !== 'user') return ''
        return message.content.find((part) => part.type === 'text')?.text ?? ''
    })
    const status = useAssistantState(({ message }) => {
        if (message.role !== 'user') return undefined
        const custom = message.metadata.custom as Partial<HappyChatMessageMetadata> | undefined
        return custom?.status
    })
    const localId = useAssistantState(({ message }) => {
        if (message.role !== 'user') return null
        const custom = message.metadata.custom as Partial<HappyChatMessageMetadata> | undefined
        return custom?.localId ?? null
    })
    const attachments = useAssistantState(({ message }) => {
        if (message.role !== 'user') return undefined
        const custom = message.metadata.custom as Partial<HappyChatMessageMetadata> | undefined
        return custom?.attachments
    })
    const isCliOutput = useAssistantState(({ message }) => {
        const custom = message.metadata.custom as Partial<HappyChatMessageMetadata> | undefined
        return custom?.kind === 'cli-output'
    })
    const cliText = useAssistantState(({ message }) => {
        const custom = message.metadata.custom as Partial<HappyChatMessageMetadata> | undefined
        if (custom?.kind !== 'cli-output') return ''
        return message.content.find((part) => part.type === 'text')?.text ?? ''
    })
    // 获取消息创建时间
    const createdAt = useAssistantState(({ message }) => message.createdAt)

    if (role !== 'user') return null
    const canRetry = status === 'failed' && typeof localId === 'string' && Boolean(ctx.onRetryMessage)
    const onRetry = canRetry ? () => ctx.onRetryMessage!(localId) : undefined

    // 处理引用消息 - 通过自定义事件通知 Composer 组件
    const handleQuote = useCallback(() => {
        if (!text) return
        // 触发自定义事件，让 Composer 组件处理引用
        const event = new CustomEvent('hapi:quote-message', {
            detail: { text }
        })
        window.dispatchEvent(event)
    }, [text])

    // 格式化显示时间
    const formattedTime = useMemo(() => {
        if (createdAt) {
            return formatDateTime(createdAt)
        }
        return ''
    }, [createdAt])

    const userBubbleClass = 'user-bubble-gradient w-fit min-w-0 max-w-[92%] ml-auto rounded-xl px-3 py-2 text-[var(--app-fg)] shadow-sm'
    const userContentClass = 'user-content-bg'

    if (isCliOutput) {
        return (
            <MessagePrimitive.Root className="px-1 min-w-0 max-w-full overflow-x-hidden">
                <div className="ml-auto w-full max-w-[92%]">
                    <CliOutputBlock text={cliText} />
                </div>
            </MessagePrimitive.Root>
        )
    }

    const hasText = text.length > 0
    const hasAttachments = attachments && attachments.length > 0

    return (
        <MessagePrimitive.Root className={userBubbleClass}>
            <div className="flex flex-col gap-2">
                {/* 时间戳和引用按钮行 */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--app-hint)]">
                        {formattedTime}
                    </span>
                    <button
                        type="button"
                        onClick={handleQuote}
                        className="bubble-quote-btn flex items-center gap-1 px-2 py-1 text-xs text-[var(--app-hint)] hover:text-[var(--app-link)] hover:bg-[var(--app-secondary-bg)] rounded transition-colors"
                        title={t('composer.quote')}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                        </svg>
                        {t('composer.quote')}
                    </button>
                </div>
                {/* 消息内容 */}
                <div className="flex items-end gap-2">
                    <div className="flex-1 min-w-0">
                        <div className={userContentClass}>
                            {hasText && <LazyRainbowText text={text} />}
                            {hasAttachments && <MessageAttachments attachments={attachments} />}
                        </div>
                    </div>
                    {status ? (
                        <div className="shrink-0 self-end pb-0.5">
                            <MessageStatusIndicator status={status} onRetry={onRetry} />
                        </div>
                    ) : null}
                </div>
            </div>
        </MessagePrimitive.Root>
    )
}
