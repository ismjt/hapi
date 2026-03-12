/**
 * 企业微信 Webhook 通知渠道
 *
 * 通过企业微信机器人 Webhook 发送会话通知
 */

import type { Session } from '../sync/syncEngine'
import type { NotificationChannel } from '../notifications/notificationTypes'
import { getAgentName, getSessionName } from '../notifications/sessionInfo'

interface WecomMarkdownMessage {
    msgtype: 'markdown'
    markdown: {
        content: string
    }
}

export class WecomWebhookChannel implements NotificationChannel {
    constructor(
        private readonly getGlobalWebhook: () => string | null
    ) {}

    /**
     * 获取会话的 webhook URL
     * 优先使用会话级 webhook，否则使用全局 webhook
     */
    private getWebhookForSession(session: Session): string | null {
        const sessionWebhook = session.metadata?.notification?.wecomWebhook
        if (typeof sessionWebhook === 'string' && sessionWebhook.length > 0) {
            return sessionWebhook
        }
        return this.getGlobalWebhook()
    }

    /**
     * 检查会话是否启用了通知
     */
    private isNotificationEnabled(session: Session): boolean {
        return session.metadata?.notification?.enabled !== false
    }

    /**
     * 发送企业微信消息
     */
    private async sendWebhookMessage(webhook: string, message: WecomMarkdownMessage): Promise<void> {
        try {
            const response = await fetch(webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            })

            if (!response.ok) {
                const text = await response.text().catch(() => '')
                console.error(`[WecomWebhook] HTTP ${response.status}: ${text}`)
            }
        } catch (error) {
            console.error('[WecomWebhook] Failed to send message:', error)
        }
    }

    /**
     * 发送会话就绪通知
     */
    async sendReady(session: Session): Promise<void> {
        if (!session.active) return
        if (!this.isNotificationEnabled(session)) return

        const webhook = this.getWebhookForSession(session)
        if (!webhook) return

        const agentName = getAgentName(session)
        const sessionName = getSessionName(session)

        const message: WecomMarkdownMessage = {
            msgtype: 'markdown',
            markdown: {
                content: `## ${agentName} 准备就绪\n> 会话: **${sessionName}**\n\n请继续您的对话。`
            }
        }

        await this.sendWebhookMessage(webhook, message)
    }

    /**
     * 发送权限请求通知
     */
    async sendPermissionRequest(session: Session): Promise<void> {
        if (!session.active) return
        if (!this.isNotificationEnabled(session)) return

        const webhook = this.getWebhookForSession(session)
        if (!webhook) return

        const agentName = getAgentName(session)
        const sessionName = getSessionName(session)
        const requestCount = session.agentState?.requests
            ? Object.keys(session.agentState.requests).length
            : 0

        const message: WecomMarkdownMessage = {
            msgtype: 'markdown',
            markdown: {
                content: `## ${agentName} 请求权限\n> 会话: **${sessionName}**\n\n有 **${requestCount}** 个待处理的权限请求，请及时处理。`
            }
        }

        await this.sendWebhookMessage(webhook, message)
    }

    /**
     * 发送会话结束通知
     */
    async sendEnd(session: Session): Promise<void> {
        if (!this.isNotificationEnabled(session)) return

        const webhook = this.getWebhookForSession(session)
        if (!webhook) return

        const agentName = getAgentName(session)
        const sessionName = getSessionName(session)

        const message: WecomMarkdownMessage = {
            msgtype: 'markdown',
            markdown: {
                content: `## ${agentName} 会话结束\n> 会话：**${sessionName}**\n\n会话已正常结束。`
            }
        }

        await this.sendWebhookMessage(webhook, message)
    }
}
