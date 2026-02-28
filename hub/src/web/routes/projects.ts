import { Hono } from 'hono'
import { z } from 'zod'
import type { ProjectStore, StoredProject } from '../../store'
import type { SyncEngine } from '../../sync/syncEngine'
import type { WebAppEnv } from '../middleware/auth'
import { requireSyncEngine } from './guards'

const createProjectSchema = z.object({
    name: z.string().min(1).max(255),
    path: z.string().min(1),
    tags: z.array(z.string().max(50)).max(10).optional()
})

const updateProjectSchema = z.object({
    name: z.string().min(1).max(255),
    path: z.string().min(1),
    tags: z.array(z.string().max(50)).max(10).optional()
})

type ProjectResponse = {
    id: string
    name: string
    path: string
    tags: string[]
    createdAt: number
    updatedAt: number
}

function toProjectResponse(project: StoredProject): ProjectResponse {
    return {
        id: project.id,
        name: project.name,
        path: project.path,
        tags: project.tags,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
    }
}

export function createProjectsRoutes(
    getProjectStore: () => ProjectStore,
    getSyncEngine: () => SyncEngine | null
): Hono<WebAppEnv> {
    const app = new Hono<WebAppEnv>()

    // 获取项目列表
    app.get('/projects', (c) => {
        const projectStore = getProjectStore()
        const namespace = c.get('namespace')
        const projects = projectStore.getProjectsByNamespace(namespace)
        return c.json({ projects: projects.map(toProjectResponse) })
    })

    // 创建项目
    app.post('/projects', async (c) => {
        const projectStore = getProjectStore()
        const namespace = c.get('namespace')

        const body = await c.req.json().catch(() => null)
        const parsed = createProjectSchema.safeParse(body)
        if (!parsed.success) {
            return c.json({ error: 'Invalid body: name and path are required' }, 400)
        }

        // 检查是否已存在相同路径的项目
        const existing = projectStore.getProjectByPath(parsed.data.path, namespace)
        if (existing) {
            return c.json({ error: 'Project with this path already exists' }, 409)
        }

        const id = crypto.randomUUID()
        const project = projectStore.createProject(
            id,
            parsed.data.name,
            parsed.data.path,
            namespace,
            parsed.data.tags ?? []
        )

        return c.json({ project: toProjectResponse(project) }, 201)
    })

    // 获取单个项目
    app.get('/projects/:id', (c) => {
        const projectStore = getProjectStore()
        const namespace = c.get('namespace')
        const projectId = c.req.param('id')

        const project = projectStore.getProjectByNamespace(projectId, namespace)
        if (!project) {
            return c.json({ error: 'Project not found' }, 404)
        }

        return c.json({ project: toProjectResponse(project) })
    })

    // 更新项目
    app.patch('/projects/:id', async (c) => {
        const projectStore = getProjectStore()
        const namespace = c.get('namespace')
        const projectId = c.req.param('id')

        const body = await c.req.json().catch(() => null)
        const parsed = updateProjectSchema.safeParse(body)
        if (!parsed.success) {
            return c.json({ error: 'Invalid body: name and path are required' }, 400)
        }

        // 检查是否存在
        const existing = projectStore.getProjectByNamespace(projectId, namespace)
        if (!existing) {
            return c.json({ error: 'Project not found' }, 404)
        }

        // 检查路径是否与其他项目冲突
        if (parsed.data.path !== existing.path) {
            const conflict = projectStore.getProjectByPath(parsed.data.path, namespace)
            if (conflict && conflict.id !== projectId) {
                return c.json({ error: 'Project with this path already exists' }, 409)
            }
        }

        const updated = projectStore.updateProject(
            projectId,
            parsed.data.name,
            parsed.data.path,
            namespace,
            parsed.data.tags ?? []
        )

        if (!updated) {
            return c.json({ error: 'Failed to update project' }, 500)
        }

        return c.json({ project: toProjectResponse(updated) })
    })

    // 删除项目
    app.delete('/projects/:id', (c) => {
        const projectStore = getProjectStore()
        const namespace = c.get('namespace')
        const projectId = c.req.param('id')

        const deleted = projectStore.deleteProject(projectId, namespace)
        if (!deleted) {
            return c.json({ error: 'Project not found' }, 404)
        }

        return c.json({ ok: true })
    })

    // 获取项目目录列表
    app.get('/projects/:id/directory', async (c) => {
        const engine = requireSyncEngine(c, getSyncEngine)
        if (engine instanceof Response) {
            return engine
        }

        const projectStore = getProjectStore()
        const namespace = c.get('namespace')
        const projectId = c.req.param('id')

        const project = projectStore.getProjectByNamespace(projectId, namespace)
        if (!project) {
            return c.json({ error: 'Project not found' }, 404)
        }

        // 获取查询参数中的子路径
        const subPath = c.req.query('path') || ''
        const fullPath = subPath ? `${project.path}/${subPath}` : project.path

        // 获取在线机器
        const onlineMachines = engine.getOnlineMachinesByNamespace(namespace)
        if (onlineMachines.length === 0) {
            return c.json({ success: false, error: 'No machine online' }, 503)
        }

        // 使用第一个在线机器
        const machine = onlineMachines[0]
        const result = await engine.listProjectDirectory(machine.id, fullPath)

        return c.json(result)
    })

    return app
}
