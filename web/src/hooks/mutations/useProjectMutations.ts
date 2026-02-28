import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiClient } from '@/api/client'
import type { CreateProjectRequest, UpdateProjectRequest, Project } from '@/types/api'
import { queryKeys } from '@/lib/query-keys'

export function useCreateProject(api: ApiClient | null): {
    createProject: (data: CreateProjectRequest) => Promise<Project>
    isPending: boolean
    error: string | null
} {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (data: CreateProjectRequest) => {
            if (!api) {
                throw new Error('API unavailable')
            }
            const response = await api.createProject(data)
            return response.project
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.projects })
        },
    })

    return {
        createProject: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error instanceof Error ? mutation.error.message : mutation.error ? 'Failed to create project' : null,
    }
}

export function useUpdateProject(api: ApiClient | null): {
    updateProject: (projectId: string, data: UpdateProjectRequest) => Promise<Project>
    isPending: boolean
    error: string | null
} {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async ({ projectId, data }: { projectId: string; data: UpdateProjectRequest }) => {
            if (!api) {
                throw new Error('API unavailable')
            }
            const response = await api.updateProject(projectId, data)
            return response.project
        },
        onSuccess: (updatedProject, { projectId }) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.projects })
            queryClient.setQueryData(queryKeys.project(projectId), { project: updatedProject })
        },
    })

    return {
        updateProject: (projectId, data) => mutation.mutateAsync({ projectId, data }),
        isPending: mutation.isPending,
        error: mutation.error instanceof Error ? mutation.error.message : mutation.error ? 'Failed to update project' : null,
    }
}

export function useDeleteProject(api: ApiClient | null): {
    deleteProject: (projectId: string) => Promise<void>
    isPending: boolean
    error: string | null
} {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (projectId: string) => {
            if (!api) {
                throw new Error('API unavailable')
            }
            await api.deleteProject(projectId)
        },
        onSuccess: (_data, projectId) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.projects })
            queryClient.removeQueries({ queryKey: queryKeys.project(projectId) })
        },
    })

    return {
        deleteProject: mutation.mutateAsync,
        isPending: mutation.isPending,
        error: mutation.error instanceof Error ? mutation.error.message : mutation.error ? 'Failed to delete project' : null,
    }
}
