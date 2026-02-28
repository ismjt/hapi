import type { Database } from 'bun:sqlite'

import type { StoredProject } from './types'
import {
    createProject,
    deleteProject,
    getProject,
    getProjectByNamespace,
    getProjectByPath,
    getProjectsByNamespace,
    updateProject
} from './projects'

export class ProjectStore {
    private readonly db: Database

    constructor(db: Database) {
        this.db = db
    }

    createProject(id: string, name: string, path: string, namespace: string, tags: string[] = []): StoredProject {
        return createProject(this.db, id, name, path, namespace, tags)
    }

    getProject(id: string): StoredProject | null {
        return getProject(this.db, id)
    }

    getProjectByNamespace(id: string, namespace: string): StoredProject | null {
        return getProjectByNamespace(this.db, id, namespace)
    }

    getProjectsByNamespace(namespace: string): StoredProject[] {
        return getProjectsByNamespace(this.db, namespace)
    }

    updateProject(id: string, name: string, path: string, namespace: string, tags: string[] = []): StoredProject | null {
        return updateProject(this.db, id, name, path, namespace, tags)
    }

    deleteProject(id: string, namespace: string): boolean {
        return deleteProject(this.db, id, namespace)
    }

    getProjectByPath(path: string, namespace: string): StoredProject | null {
        return getProjectByPath(this.db, path, namespace)
    }
}
