import { useCallback, useState, useRef, KeyboardEvent } from 'react'
import { useNavigate, Outlet, useMatchRoute } from '@tanstack/react-router'
import { useAppContext } from '@/lib/app-context'
import { useAppGoBack } from '@/hooks/useAppGoBack'
import { useProjects } from '@/hooks/queries/useProjects'
import { useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/mutations/useProjectMutations'
import { useTranslation } from '@/lib/use-translation'
import type { Project } from '@/types/api'

function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    )
}

function FolderIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    )
}

function EditIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    )
}

function TrashIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

function BackIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
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

type ProjectFormData = { name: string; path: string; tags: string[] }

function TagInput({ tags, onTagsChange }: { tags: string[]; onTagsChange: (tags: string[]) => void }) {
    const { t } = useTranslation()
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const addTag = useCallback((tag: string) => {
        const trimmed = tag.trim()
        if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
            onTagsChange([...tags, trimmed])
        }
        setInputValue('')
    }, [tags, onTagsChange])

    const removeTag = useCallback((index: number) => {
        onTagsChange(tags.filter((_, i) => i !== index))
    }, [tags, onTagsChange])

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag(inputValue)
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1)
        }
    }

    return (
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
                        onClick={() => removeTag(index)}
                        className="ml-0.5 hover:text-red-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </span>
            ))}
            {tags.length < 10 && (
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tags.length === 0 ? t('projects.tagsPlaceholder') : ''}
                    className="flex-1 min-w-[100px] bg-transparent text-sm text-[var(--app-fg)] placeholder-[var(--app-hint)] focus:outline-none"
                    maxLength={50}
                />
            )}
        </div>
    )
}

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
                            <TagInput tags={tags} onTagsChange={setTags} />
                            <p className="mt-1 text-xs text-[var(--app-hint)]">{t('projects.tagsHint')}</p>
                        </div>
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

function ProjectItem({
    project,
    onViewDirectory,
    onEdit,
    onDelete
}: {
    project: Project
    onViewDirectory: () => void
    onEdit: () => void
    onDelete: () => void
}) {
    return (
        <div className="flex items-center gap-3 p-3 border-b border-[var(--app-border)] last:border-b-0">
            <div className="flex-shrink-0 text-[var(--app-hint)]">
                <FolderIcon />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{project.name}</div>
                <div className="text-sm text-[var(--app-hint)] font-mono truncate">{project.path}</div>
                {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {project.tags.slice(0, 2).map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded bg-[var(--app-secondary-bg)] text-[var(--app-hint)]"
                            >
                                <TagIcon />
                                {tag}
                            </span>
                        ))}
                        {project.tags.length > 2 && (
                            <span className="text-xs text-[var(--app-hint)]">...</span>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onViewDirectory}
                    className="p-2 rounded text-[var(--app-hint)] hover:text-[var(--app-fg)] hover:bg-[var(--app-subtle-bg)]"
                    title="View directory"
                >
                    <FolderIcon />
                </button>
                <button
                    type="button"
                    onClick={onEdit}
                    className="p-2 rounded text-[var(--app-hint)] hover:text-[var(--app-fg)] hover:bg-[var(--app-subtle-bg)]"
                    title="Edit"
                >
                    <EditIcon />
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="p-2 rounded text-[var(--app-hint)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Delete"
                >
                    <TrashIcon />
                </button>
            </div>
        </div>
    )
}

export default function ProjectsPage() {
    const { api } = useAppContext()
    const navigate = useNavigate()
    const goBack = useAppGoBack()
    const { t } = useTranslation()
    const matchRoute = useMatchRoute()
    const { projects, isLoading, error, refetch } = useProjects(api)
    const { createProject, isPending: isCreating } = useCreateProject(api)
    const { updateProject, isPending: isUpdating } = useUpdateProject(api)
    const { deleteProject, isPending: isDeleting } = useDeleteProject(api)

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [deletingProject, setDeletingProject] = useState<Project | null>(null)

    // 检测是否在子路由中
    const isOnSubRoute = matchRoute({ to: '/projects/$projectId' })

    const handleCreate = useCallback(async (data: ProjectFormData) => {
        try {
            await createProject({ name: data.name, path: data.path, tags: data.tags })
            setShowCreateDialog(false)
        } catch {
            // Error is handled by mutation
        }
    }, [createProject])

    const handleEdit = useCallback(async (data: ProjectFormData) => {
        if (!editingProject) return
        try {
            await updateProject(editingProject.id, { name: data.name, path: data.path, tags: data.tags })
            setEditingProject(null)
        } catch {
            // Error is handled by mutation
        }
    }, [editingProject, updateProject])

    const handleDelete = useCallback(async () => {
        if (!deletingProject) return
        try {
            await deleteProject(deletingProject.id)
            setDeletingProject(null)
        } catch {
            // Error is handled by mutation
        }
    }, [deletingProject, deleteProject])

    const handleViewDirectory = useCallback((project: Project) => {
        navigate({
            to: '/projects/$projectId/directory',
            params: { projectId: project.id }
        })
    }, [navigate])

    // 如果在子路由中，渲染 Outlet
    if (isOnSubRoute) {
        return <Outlet />
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
                <button
                    type="button"
                    onClick={() => setShowCreateDialog(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-link)] hover:bg-[var(--app-subtle-bg)]"
                >
                    <PlusIcon />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
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
                ) : isLoading ? (
                    <div className="p-4 text-center text-[var(--app-hint)]">
                        {t('misc.loading')}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="p-4 text-center text-[var(--app-hint)]">
                        {t('projects.empty')}
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--app-border)]">
                        {projects.map((project) => (
                            <ProjectItem
                                key={project.id}
                                project={project}
                                onViewDirectory={() => handleViewDirectory(project)}
                                onEdit={() => setEditingProject(project)}
                                onDelete={() => setDeletingProject(project)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Dialogs */}
            {showCreateDialog && (
                <ProjectFormDialog
                    title={t('projects.create.title')}
                    initialData={{ name: '', path: '', tags: [] }}
                    onSubmit={handleCreate}
                    onCancel={() => setShowCreateDialog(false)}
                    isPending={isCreating}
                    submitLabel={t('projects.create.submit')}
                />
            )}

            {editingProject && (
                <ProjectFormDialog
                    title={t('projects.edit.title')}
                    initialData={{ name: editingProject.name, path: editingProject.path, tags: editingProject.tags || [] }}
                    onSubmit={handleEdit}
                    onCancel={() => setEditingProject(null)}
                    isPending={isUpdating}
                    submitLabel={t('button.save')}
                />
            )}

            {deletingProject && (
                <DeleteConfirmDialog
                    projectName={deletingProject.name}
                    onConfirm={handleDelete}
                    onCancel={() => setDeletingProject(null)}
                    isPending={isDeleting}
                />
            )}
        </div>
    )
}
