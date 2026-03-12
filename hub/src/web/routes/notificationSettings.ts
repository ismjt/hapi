/**
 * 通知设置 API 路由
 */

import { Hono } from 'hono'
import { z } from 'zod'
import type { SyncEngine } from '../../sync/syncEngine'
import type { WebAppEnv } from '../middleware/auth'
import { requireSessionFromParam, requireSyncEngine } from './guards'
import { getConfiguration } from '../../configuration'
import { readSettings, writeSettings } from '../../config/settings'

const notificationSettingsSchema = z.object({
    enabled: z.boolean().optional(),
    wecomWebhook: z.string().nullable().optional()
})

export function createNotificationSettingsRoutes(
    getSyncEngine: () => SyncEngine | null,
    hasGlobalWecomWebhook: () => boolean
): Hono<WebAppEnv> {
    const app = new Hono<WebAppEnv>()

    // 获取全局通知配置状态
    app.get('/notification-config', (c) => {
        return c.json({
            hasGlobalWecomWebhook: hasGlobalWecomWebhook()
        })
    })

    // 更新全局通知配置（企业微信 Webhook)
    app.patch('/notification-config', async (c) => {
        const body = await c.req.json().catch(() => null)
        const parsed = z.object({
            wecomWebhook: z.string().nullable().optional()
        }).safeParse(body)

        if (!parsed.success) {
            return c.json({ error: 'Invalid body' }, 400)
        }

        const { wecomWebhook } = parsed.data

        try {
            const config = getConfiguration()
            const currentSettings = await readSettings(config.settingsFile)

            // 更新 wecomWebhook 字段
            const updatedSettings = {
                ...currentSettings,
                wecomWebhook: wecomWebhook ?? undefined
            }

            await writeSettings(config.settingsFile, updatedSettings)

            return c.json({
                ok: true,
                hasGlobalWecomWebhook: Boolean(wecomWebhook)
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update notification config'
            return c.json({ error: message }, 500)
        }
    })

    // 获取会话的通知设置
    app.get('/sessions/:id/notification-settings', (c) => {
        const engine = requireSyncEngine(c, getSyncEngine)
        if (engine instanceof Response) {
            return engine
        }

        const sessionResult = requireSessionFromParam(c, engine)
        if (sessionResult instanceof Response) {
            return sessionResult
        }

        const session = sessionResult.session
        const notification = session.metadata?.notification

        return c.json({
            enabled: notification?.enabled === true,
            wecomWebhook: notification?.wecomWebhook ?? null
        })
    })

    // 更新会话的通知设置
    app.patch('/sessions/:id/notification-settings', async (c) => {
        const engine = requireSyncEngine(c, getSyncEngine)
        if (engine instanceof Response) {
            return engine
        }

        const sessionResult = requireSessionFromParam(c, engine)
        if (sessionResult instanceof Response) {
            return sessionResult
        }

        const sessionId = sessionResult.sessionId
        const body = await c.req.json().catch(() => null)
        const parsed = notificationSettingsSchema.safeParse(body)
        if (!parsed.success) {
            return c.json({ error: 'Invalid body' }, 400)
        }

        const { enabled, wecomWebhook } = parsed.data

        try {
            await engine.updateSessionNotificationSettings(sessionId, {
                enabled,
                wecomWebhook
            })
            return c.json({ ok: true })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update notification settings'
            return c.json({ error: message }, 500)
        }
    })

    return app
}
