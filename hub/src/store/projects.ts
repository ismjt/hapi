import type { Database } from 'bun:sqlite'

import type { StoredProject } from './types'

type DbProjectRow = {
    id: string
    namespace: string
    name: string
    path: string
    tags: string | null
    created_at: number
    updated_at: number
}

function toStoredProject(row: DbProjectRow): StoredProject {
    let tags: string[] = []
    if (row.tags) {
        try {
            tags = JSON.parse(row.tags)
            if (!Array.isArray(tags)) tags = []
        } catch {
            tags = []
        }
    }
    return {
        id: row.id,
        namespace: row.namespace,
        name: row.name,
        path: row.path,
        tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
}

/**
 * 创建新项目
 */
export function createProject(
    db: Database,
    id: string,
    name: string,
    path: string,
    namespace: string,
    tags: string[] = []
): StoredProject {
    const now = Date.now()

    db.prepare(`
        INSERT INTO projects (
            id, namespace, name, path, tags, created_at, updated_at
        ) VALUES (
            @id, @namespace, @name, @path, @tags, @created_at, @updated_at
        )
    `).run({
        id,
        namespace,
        name,
        path,
        tags: JSON.stringify(tags),
        created_at: now,
        updated_at: now
    })

    const row = getProject(db, id)
    if (!row) {
        throw new Error('Failed to create project')
    }
    return row
}

/**
 * 获取单个项目
 */
export function getProject(db: Database, id: string): StoredProject | null {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as DbProjectRow | undefined
    return row ? toStoredProject(row) : null
}

/**
 * 按 namespace 获取单个项目
 */
export function getProjectByNamespace(db: Database, id: string, namespace: string): StoredProject | null {
    const row = db.prepare(
        'SELECT * FROM projects WHERE id = ? AND namespace = ?'
    ).get(id, namespace) as DbProjectRow | undefined
    return row ? toStoredProject(row) : null
}

/**
 * 获取项目列表
 */
export function getProjectsByNamespace(db: Database, namespace: string): StoredProject[] {
    const rows = db.prepare(
        'SELECT * FROM projects WHERE namespace = ? ORDER BY updated_at DESC'
    ).all(namespace) as DbProjectRow[]
    return rows.map(toStoredProject)
}

/**
 * 更新项目
 */
export function updateProject(
    db: Database,
    id: string,
    name: string,
    path: string,
    namespace: string,
    tags: string[] = []
): StoredProject | null {
    const now = Date.now()

    const result = db.prepare(`
        UPDATE projects
        SET name = @name, path = @path, tags = @tags, updated_at = @updated_at
        WHERE id = @id AND namespace = @namespace
    `).run({
        id,
        name,
        path,
        tags: JSON.stringify(tags),
        namespace,
        updated_at: now
    })

    if (result.changes === 0) {
        return null
    }

    return getProjectByNamespace(db, id, namespace)
}

/**
 * 删除项目
 */
export function deleteProject(db: Database, id: string, namespace: string): boolean {
    const result = db.prepare(
        'DELETE FROM projects WHERE id = ? AND namespace = ?'
    ).run(id, namespace)

    return result.changes > 0
}

/**
 * 按路径查找项目
 */
export function getProjectByPath(db: Database, path: string, namespace: string): StoredProject | null {
    const row = db.prepare(
        'SELECT * FROM projects WHERE path = ? AND namespace = ?'
    ).get(path, namespace) as DbProjectRow | undefined
    return row ? toStoredProject(row) : null
}
