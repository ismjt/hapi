import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { ApiClient } from '@/api/client'
import type { AttachmentMetadata, DecryptedMessage } from '@/types/api'
import { makeClientSideId } from '@/lib/messages'
import {
    appendOptimisticMessage,
    getMessageWindowState,
    updateMessageStatus,
} from '@/lib/message-window-store'
import { usePlatform } from '@/hooks/usePlatform'

type SendMessageInput = {
    sessionId: string
    text: string
    localId: string
    createdAt: number
    attachments?: AttachmentMetadata[]
}

type BlockedReason = 'no-api' | 'no-session' | 'pending'

type QueuedMessage = {
    sessionId: string
    text: string
    localId: string
    createdAt: number
    attachments?: AttachmentMetadata[]
}

type UseSendMessageOptions = {
    resolveSessionId?: (sessionId: string) => Promise<string>
    onSessionResolved?: (sessionId: string) => void
    onBlocked?: (reason: BlockedReason) => void
    isSessionRunning?: (sessionId: string) => boolean
    enableQueue?: boolean
}

function findMessageByLocalId(
    sessionId: string,
    localId: string,
): DecryptedMessage | null {
    const state = getMessageWindowState(sessionId)
    for (const message of state.messages) {
        if (message.localId === localId) return message
    }
    for (const message of state.pending) {
        if (message.localId === localId) return message
    }
    return null
}

function createOptimisticMessage(
    input: SendMessageInput,
    status: 'sending' | 'queued',
): DecryptedMessage {
    return {
        id: input.localId,
        seq: null,
        localId: input.localId,
        content: {
            role: 'user',
            content: {
                type: 'text',
                text: input.text,
                attachments: input.attachments
            }
        },
        createdAt: input.createdAt,
        status,
        originalText: input.text,
    }
}

export function useSendMessage(
    api: ApiClient | null,
    sessionId: string | null,
    options?: UseSendMessageOptions
): {
    sendMessage: (text: string, attachments?: AttachmentMetadata[]) => void
    retryMessage: (localId: string) => void
    isSending: boolean
    isDequeuing: boolean
    queuedMessages: QueuedMessage[]
    setIsDequeuing: (value: boolean) => void
} {
    const { haptic } = usePlatform()
    const [isResolving, setIsResolving] = useState(false)
    const [isDequeuing, setIsDequeuing] = useState(false)
    const [queuedMessages, setQueuedMessages] = useState<QueuedMessage[]>([])
    const resolveGuardRef = useRef(false)

    const mutation = useMutation({
        mutationFn: async (input: SendMessageInput) => {
            if (!api) {
                throw new Error('API unavailable')
            }
            await api.sendMessage(input.sessionId, input.text, input.localId, input.attachments)
        },
        onMutate: async (input) => {
            const optimisticMessage = createOptimisticMessage(input, 'sending')
            appendOptimisticMessage(input.sessionId, optimisticMessage)
        },
        onSuccess: (_, input) => {
            updateMessageStatus(input.sessionId, input.localId, 'sent')
            haptic.notification('success')
        },
        onError: (_, input) => {
            updateMessageStatus(input.sessionId, input.localId, 'failed')
            haptic.notification('error')
        },
    })

    const sendQueuedMessage = (queued: QueuedMessage) => {
        mutation.mutate({
            sessionId: queued.sessionId,
            text: queued.text,
            localId: queued.localId,
            createdAt: queued.createdAt,
            attachments: queued.attachments,
        })
    }

    useEffect(() => {
        if (
            !isDequeuing ||
            queuedMessages.length === 0 ||
            mutation.isPending ||
            resolveGuardRef.current
        ) {
            return
        }

        const [next, ...rest] = queuedMessages
        setQueuedMessages(rest)

        let targetSessionId = next.sessionId
        void (async () => {
            if (options?.resolveSessionId) {
                resolveGuardRef.current = true
                try {
                    const resolved = await options.resolveSessionId(next.sessionId)
                    if (resolved && resolved !== next.sessionId) {
                        options.onSessionResolved?.(resolved)
                        targetSessionId = resolved
                    }
                } catch (error) {
                    haptic.notification('error')
                    console.error('Failed to resolve session before dequeuing:', error)
                    setIsDequeuing(false)
                    return
                } finally {
                    resolveGuardRef.current = false
                }
            }

            sendQueuedMessage({
                ...next,
                sessionId: targetSessionId,
            })
        })()
    }, [isDequeuing, queuedMessages, mutation.isPending])

    const sendMessage = (text: string, attachments?: AttachmentMetadata[]) => {
        if (!api) {
            options?.onBlocked?.('no-api')
            haptic.notification('error')
            return
        }
        if (!sessionId) {
            options?.onBlocked?.('no-session')
            haptic.notification('error')
            return
        }

        const running = options?.isSessionRunning?.(sessionId) ?? false
        const queueEnabled = options?.enableQueue ?? false

        if (mutation.isPending || resolveGuardRef.current) {
            if (queueEnabled && running) {
                options?.onBlocked?.('pending')
                return
            }
        }

        const localId = makeClientSideId('local')
        const createdAt = Date.now()

        if (queueEnabled && running) {
            const queued: QueuedMessage = {
                sessionId,
                text,
                localId,
                createdAt,
                attachments,
            }
            const optimisticMessage = createOptimisticMessage(
                { sessionId, text, localId, createdAt, attachments },
                'queued',
            )
            appendOptimisticMessage(sessionId, optimisticMessage)
            setQueuedMessages((prev) => [...prev, queued])
            return
        }

        void (async () => {
            let targetSessionId = sessionId
            if (options?.resolveSessionId) {
                resolveGuardRef.current = true
                setIsResolving(true)
                try {
                    const resolved = await options.resolveSessionId(sessionId)
                    if (resolved && resolved !== sessionId) {
                        options.onSessionResolved?.(resolved)
                        targetSessionId = resolved
                    }
                } catch (error) {
                    haptic.notification('error')
                    console.error('Failed to resolve session before send:', error)
                    return
                } finally {
                    resolveGuardRef.current = false
                    setIsResolving(false)
                }
            }
            mutation.mutate({
                sessionId: targetSessionId,
                text,
                localId,
                createdAt,
                attachments,
            })
        })()
    }

    const retryMessage = (localId: string) => {
        if (!api) {
            options?.onBlocked?.('no-api')
            haptic.notification('error')
            return
        }
        if (!sessionId) {
            options?.onBlocked?.('no-session')
            haptic.notification('error')
            return
        }
        if (mutation.isPending || resolveGuardRef.current) {
            options?.onBlocked?.('pending')
            return
        }

        const message = findMessageByLocalId(sessionId, localId)
        if (!message?.originalText) return

        updateMessageStatus(sessionId, localId, 'sending')

        mutation.mutate({
            sessionId,
            text: message.originalText,
            localId,
            createdAt: message.createdAt,
        })
    }

    return {
        sendMessage,
        retryMessage,
        isSending: mutation.isPending || isResolving,
        isDequeuing,
        queuedMessages,
        setIsDequeuing,
    }
}
