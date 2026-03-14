/**
 * 快捷命令 API 路由
 */

import { Hono } from 'hono'
import { z } from 'zod'
import type { QuickCommandStore } from '../../store/quickCommandStore'
import type { SyncEngine } from '../../sync/syncEngine'
import type { WebAppEnv } from '../middleware/auth'
import { requireSessionFromParam, requireSyncEngine } from './guards'

const createQuickCommandSchema = z.object({
    text: z.string().min(1).max(1000)
})

const deleteQuickCommandSchema = z.object({
    id: z.string()
})

export function createQuickCommandsRoutes(
    getQuickCommands: () => QuickCommandStore,
    getSyncEngine: () => SyncEngine | null
): Hono<WebAppEnv> {
    const app = new Hono<WebAppEnv>()

    // 获取会话的所有快捷命令
    app.get('/sessions/:id/quick-commands', (c) => {
        const engine = requireSyncEngine(c, getSyncEngine)
        if (engine instanceof Response) {
            return engine
        }

        const sessionResult = requireSessionFromParam(c, engine)
        if (sessionResult instanceof Response) {
            return sessionResult
        }

        const { session } = sessionResult

        // 从 store 获取快捷命令
        const commands = getQuickCommands().getQuickCommandsBySession(session.id)

        return c.json({
            commands: commands.map(cmd => ({
                id: cmd.id,
                text: cmd.text,
                createdAt: cmd.createdAt
            }))
        })
    })

    // 创建快捷命令
    app.post('/sessions/:id/quick-commands', async (c) => {
        const engine = requireSyncEngine(c, getSyncEngine)
        if (engine instanceof Response) {
            return engine
        }

        const sessionResult = requireSessionFromParam(c, engine)
        if (sessionResult instanceof Response) {
            return sessionResult
        }

        const { session } = sessionResult
        const body = await c.req.json().catch(() => null)
        const parsed = createQuickCommandSchema.safeParse(body)

        if (!parsed.success) {
            return c.json({ error: 'Invalid body' }, 400)
        }

        const { text } = parsed.data

        try {
            const command = getQuickCommands().createQuickCommand(session.id, text)

            return c.json({
                ok: true,
                command: {
                    id: command.id,
                    text: command.text,
                    createdAt: command.createdAt
                }
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create quick command'
            return c.json({ error: message }, 500)
        }
    })

    // 删除快捷命令
    app.delete('/sessions/:id/quick-commands/:commandId', (c) => {
        const engine = requireSyncEngine(c, getSyncEngine)
        if (engine instanceof Response) {
            return engine
        }

        const sessionResult = requireSessionFromParam(c, engine)
        if (sessionResult instanceof Response) {
            return sessionResult
        }

        const { session } = sessionResult
        const commandId = c.req.param('commandId')

        if (!commandId) {
            return c.json({ error: 'Missing command id' }, 400)
        }

        try {
            const deleted = getQuickCommands().deleteQuickCommand(commandId, session.id)

            if (!deleted) {
                return c.json({ error: 'Command not found' }, 404)
            }

            return c.json({ ok: true })
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete quick command'
            return c.json({ error: message }, 500)
        }
    })

    return app
}
