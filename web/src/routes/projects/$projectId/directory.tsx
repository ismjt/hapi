import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useAppContext } from '@/lib/app-context'
import { useAppGoBack } from '@/hooks/useAppGoBack'
import { useProject, useProjectDirectory } from '@/hooks/queries/useProjects'
import { useTranslation } from '@/lib/use-translation'
import type { DirectoryEntry } from '@/types/api'

function BackIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    )
}

function FolderIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    )
}

function FileIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
        </svg>
    )
}

function ChevronRightIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    )
}

function ArrowUpIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
        </svg>
    )
}

function formatSize(bytes: number | undefined): string {
    if (bytes === undefined) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function DirectoryItem({
    entry,
    onClick
}: {
    entry: DirectoryEntry
    onClick: () => void
}) {
    const isDirectory = entry.type === 'directory'

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--app-subtle-bg)] transition-colors"
        >
            <div className="flex-shrink-0 text-[var(--app-hint)]">
                {isDirectory ? <FolderIcon /> : <FileIcon />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="truncate">{entry.name}</div>
                {entry.size !== undefined && (
                    <div className="text-xs text-[var(--app-hint)]">{formatSize(entry.size)}</div>
                )}
            </div>
            {isDirectory && (
                <div className="flex-shrink-0 text-[var(--app-hint)]">
                    <ChevronRightIcon />
                </div>
            )}
        </button>
    )
}

export default function ProjectDirectoryPage() {
    const { api } = useAppContext()
    const navigate = useNavigate()
    const goBack = useAppGoBack()
    const { t } = useTranslation()
    const { projectId } = useParams({ from: '/projects/$projectId/directory' })

    const [currentPath, setCurrentPath] = useState('')

    const { project, isLoading: projectLoading } = useProject(api, projectId)
    const { entries, isLoading: directoryLoading, error, refetch } = useProjectDirectory(api, projectId, currentPath)

    const isLoading = projectLoading || directoryLoading

    const pathParts = useMemo(() => {
        if (!currentPath) return []
        return currentPath.split('/').filter(Boolean)
    }, [currentPath])

    const handleEntryClick = useCallback((entry: DirectoryEntry) => {
        if (entry.type === 'directory') {
            setCurrentPath(prev => prev ? `${prev}/${entry.name}` : entry.name)
        }
    }, [])

    const handleGoUp = useCallback(() => {
        setCurrentPath(prev => {
            const parts = prev.split('/')
            parts.pop()
            return parts.join('/')
        })
    }, [])

    const handleBreadcrumbClick = useCallback((index: number) => {
        setCurrentPath(prev => {
            const parts = prev.split('/').filter(Boolean)
            return parts.slice(0, index + 1).join('/')
        })
    }, [])

    const handleBackToProjectInfo = useCallback(() => {
        navigate({ to: '/projects/$projectId', params: { projectId } })
    }, [navigate, projectId])

    const sortedEntries = useMemo(() => {
        if (!entries) return []
        return [...entries].sort((a, b) => {
            // Directories first
            if (a.type === 'directory' && b.type !== 'directory') return -1
            if (a.type !== 'directory' && b.type === 'directory') return 1
            // Then alphabetically
            return a.name.localeCompare(b.name)
        })
    }, [entries])

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-bg)] p-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
                <button
                    type="button"
                    onClick={handleBackToProjectInfo}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-hint)] transition-colors hover:bg-[var(--app-secondary-bg)] hover:text-[var(--app-fg)]"
                >
                    <BackIcon />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{project?.name ?? t('misc.loading')}</div>
                    <div className="text-xs text-[var(--app-hint)] font-mono truncate">
                        {project?.path}
                        {currentPath && `/${currentPath}`}
                    </div>
                </div>
            </div>

            {/* Breadcrumb */}
            {pathParts.length > 0 && (
                <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--app-border)] bg-[var(--app-secondary-bg)] overflow-x-auto">
                    <button
                        type="button"
                        onClick={handleGoUp}
                        className="flex-shrink-0 p-1 rounded text-[var(--app-hint)] hover:text-[var(--app-fg)] hover:bg-[var(--app-subtle-bg)]"
                    >
                        <ArrowUpIcon />
                    </button>
                    {pathParts.map((part, index) => (
                        <span key={index} className="flex items-center gap-1 text-sm">
                            <span className="text-[var(--app-hint)]">/</span>
                            <button
                                type="button"
                                onClick={() => handleBreadcrumbClick(index)}
                                className={`${index === pathParts.length - 1 ? 'text-[var(--app-fg)] font-medium' : 'text-[var(--app-link)]'} hover:underline`}
                            >
                                {part}
                            </button>
                        </span>
                    ))}
                </div>
            )}

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
                ) : sortedEntries.length === 0 ? (
                    <div className="p-4 text-center text-[var(--app-hint)]">
                        {t('projects.directory.empty')}
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--app-border)]">
                        {sortedEntries.map((entry, index) => (
                            <DirectoryItem
                                key={`${entry.name}-${index}`}
                                entry={entry}
                                onClick={() => handleEntryClick(entry)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
