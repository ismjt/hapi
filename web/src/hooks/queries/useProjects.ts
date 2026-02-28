import { useQuery } from '@tanstack/react-query'
import type { ApiClient } from '@/api/client'
import type { Project, DirectoryEntry } from '@/types/api'
import { queryKeys } from '@/lib/query-keys'

export function useProjects(api: ApiClient | null): {
    projects: Project[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<unknown>
} {
    const query = useQuery({
        queryKey: queryKeys.projects,
        queryFn: async () => {
            if (!api) {
                throw new Error('API unavailable')
            }
            return await api.getProjects()
        },
        enabled: Boolean(api),
    })

    return {
        projects: query.data?.projects ?? [],
        isLoading: query.isLoading,
        error: query.error instanceof Error ? query.error.message : query.error ? 'Failed to load projects' : null,
        refetch: query.refetch,
    }
}

export function useProject(api: ApiClient | null, projectId: string | null): {
    project: Project | null
    isLoading: boolean
    error: string | null
    refetch: () => Promise<unknown>
} {
    const query = useQuery({
        queryKey: projectId ? queryKeys.project(projectId) : ['project', 'none'],
        queryFn: async () => {
            if (!api || !projectId) {
                throw new Error('API or project ID unavailable')
            }
            return await api.getProject(projectId)
        },
        enabled: Boolean(api && projectId),
    })

    return {
        project: query.data?.project ?? null,
        isLoading: query.isLoading,
        error: query.error instanceof Error ? query.error.message : query.error ? 'Failed to load project' : null,
        refetch: query.refetch,
    }
}

export function useProjectDirectory(
    api: ApiClient | null,
    projectId: string | null,
    path: string
): {
    entries: DirectoryEntry[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<unknown>
} {
    const query = useQuery({
        queryKey: projectId ? queryKeys.projectDirectory(projectId, path) : ['project-directory', 'none', path],
        queryFn: async () => {
            if (!api || !projectId) {
                throw new Error('API or project ID unavailable')
            }
            return await api.listProjectDirectory(projectId, path || undefined)
        },
        enabled: Boolean(api && projectId),
    })

    return {
        entries: query.data?.entries ?? [],
        isLoading: query.isLoading,
        error: query.error instanceof Error
            ? query.error.message
            : query.data?.error
                ? query.data.error
                : query.error
                    ? 'Failed to load directory'
                    : null,
        refetch: query.refetch,
    }
}
