import { useCallback, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useAppContext } from '@/lib/app-context'
import { useAppGoBack } from '@/hooks/useAppGoBack'
import { useProject } from '@/hooks/queries/useProjects'
import { useDeleteProject } from '@/hooks/mutations/useProjectMutations'
import { useTranslation } from '@/lib/use-translation'
import type { Project } from '@/types/api'

function BackIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    )
}

function FolderIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    )
}

function EditIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    )
}

function TrashIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    )
}

function TagIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
    )
}

function FolderOpenIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <path d="M2 10h20" />
        </svg>
    )
}

function CloseIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    )
}

type ProjectFormData = { name: string; path: string; tags: string[] }

function ProjectFormDialog({
    title,
    initialData,
    onSubmit,
    onCancel,
    isPending,
    submitLabel
}: {
    title: string
    initialData: ProjectFormData
    onSubmit: (data: ProjectFormData) => void
    onCancel: () => void
    isPending: boolean
    submitLabel: string
}) {
    const [name, setName] = useState(initialData.name)
    const [path, setPath] = useState(initialData.path)
    const [tags, setTags] = useState<string[]>(initialData.tags)
    const { t } = useTranslation()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim() && path.trim()) {
            onSubmit({ name: name.trim(), path: path.trim(), tags })
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--app-bg)] rounded-lg shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-[var(--app-border)]">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1 rounded text-[var(--app-hint)] hover:text-[var(--app-fg)] hover:bg-[var(--app-subtle-bg)]"
                    >
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('projects.name')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--app-border)] rounded-md bg-[var(--app-input-bg)] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)]"
                                placeholder={t('projects.namePlaceholder')}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('projects.path')}
                            </label>
                            <input
                                type="text"
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--app-border)] rounded-md bg-[var(--app-input-bg)] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] font-mono text-sm"
                                placeholder="/path/to/project"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {t('projects.tags')}
                            </label>
                            <div className="flex flex-wrap gap-1.5 p-2 border border-[var(--app-border)] rounded-md bg-[var(--app-input-bg)] min-h-[42px]">
                                {tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[var(--app-secondary-bg)] text-[var(--app-fg)]"
                                    >
                                        <TagIcon />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                            className="ml-0.5 hover:text-red-500"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value=""
                                    onChange={(e) => {
                                        const val = e.target.value.trim()
                                        if (val && !tags.includes(val) && tags.length < 10) {
                                            setTags([...tags, val])
                                        }
                                    }}
                                    placeholder={tags.length === 0 ? t('projects.tagsPlaceholder') : ''}
                                    className="flex-1 min-w-[100px] bg-transparent text-sm text-[var(--app-fg)] placeholder-[var(--app-hint)] focus:outline-none"
                                    maxLength={50}
                                />
                            </div>
                            <p className="mt-1 text-xs text-[var(--app-hint)]">{t('projects.tagsHint')}</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 p-4 border-t border-[var(--app-border)]">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm rounded-md text-[var(--app-hint)] hover:text-[var(--app-fg)] hover:bg-[var(--app-subtle-bg)]"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !name.trim() || !path.trim()}
                            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-blue-500 text-white shadow-sm hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isPending ? t('misc.loading') : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function DeleteConfirmDialog({
    projectName,
    onConfirm,
    onCancel,
    isPending
}: {
    projectName: string
    onConfirm: () => void
    onCancel: () => void
    isPending: boolean
}) {
    const { t } = useTranslation()

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--app-bg)] rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4">
                    <h2 className="text-lg font-semibold mb-2">{t('projects.delete.title')}</h2>
                    <p className="text-[var(--app-hint)]">
                        {t('projects.delete.description', { name: projectName })}
                    </p>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-[var(--app-border)]">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm rounded-md text-[var(--app-hint)] hover:text-[var(--app-fg)] hover:bg-[var(--app-subtle-bg)]"
                    >
                        {t('button.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="px-4 py-2 text-sm rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    >
                        {isPending ? t('misc.loading') : t('button.confirm')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ProjectInfoPage() {
    const { api } = useAppContext()
    const navigate = useNavigate()
    const goBack = useAppGoBack()
    const { t } = useTranslation()
    const { projectId } = useParams({ from: '/projects/$projectId' })

    const { project, isLoading, error, refetch } = useProject(api, projectId)
    const { deleteProject, isPending: isDeleting } = useDeleteProject(api)

    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleEdit = useCallback(async (data: ProjectFormData) => {
        if (!project) return
        // Edit functionality would require an update mutation
        console.log('Edit project:', project.id, data)
        setEditingProject(null)
    }, [project])

    const handleDelete = useCallback(async () => {
        if (!project) return
        try {
            await deleteProject(project.id)
            setShowDeleteConfirm(false)
            navigate({ to: '/projects' })
        } catch {
            // Error is handled by mutation
        }
    }, [project, deleteProject, navigate])

    const handleViewDirectory = useCallback(() => {
        if (!project) return
        navigate({
            to: '/projects/$projectId/directory',
            params: { projectId: project.id }
        })
    }, [project, navigate])

    if (isLoading || !project) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <div className="text-[var(--app-hint)]">{t('misc.loading')}</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg)] p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
                <button
                    type="button"
                    onClick={goBack}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-hint)] transition-colors hover:bg-[var(--app-secondary-bg)] hover:text-[var(--app-fg)]"
                >
                    <BackIcon />
                </button>
                <div className="flex-1 font-semibold">{t('projects.title')}</div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {error ? (
                    <div className="p-4 text-center text-red-500">
                        {error}
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="block mx-auto mt-2 text-[var(--app-link)]"
                        >
                            {t('misc.loadOlder')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Project Info Card */}
                        <div className="border border-[var(--app-border)] rounded-lg p-4 bg-[var(--app-secondary-bg)]">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="text-[var(--app-hint)]">
                                    <FolderIcon />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold">{project.name}</h2>
                                    <p className="text-sm text-[var(--app-hint)] font-mono mt-1">{project.path}</p>
                                </div>
                            </div>

                            {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {project.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-[var(--app-bg)] text-[var(--app-fg)]"
                                        >
                                            <TagIcon />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={handleViewDirectory}
                                className="w-full flex items-center gap-3 p-3 border border-[var(--app-border)] rounded-lg hover:bg-[var(--app-subtle-bg)] transition-colors"
                            >
                                <FolderOpenIcon />
                                <span>{t('projects.viewDirectory')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setEditingProject(project)}
                                className="w-full flex items-center gap-3 p-3 border border-[var(--app-border)] rounded-lg hover:bg-[var(--app-subtle-bg)] transition-colors"
                            >
                                <EditIcon />
                                <span>{t('projects.edit.title')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full flex items-center gap-3 p-3 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <TrashIcon />
                                <span>{t('projects.delete.title')}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            {editingProject && (
                <ProjectFormDialog
                    title={t('projects.edit.title')}
                    initialData={{ name: editingProject.name, path: editingProject.path, tags: editingProject.tags || [] }}
                    onSubmit={handleEdit}
                    onCancel={() => setEditingProject(null)}
                    isPending={false}
                    submitLabel={t('button.save')}
                />
            )}

            {showDeleteConfirm && (
                <DeleteConfirmDialog
                    projectName={project.name}
                    onConfirm={handleDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                    isPending={isDeleting}
                />
            )}
        </div>
    )
}
