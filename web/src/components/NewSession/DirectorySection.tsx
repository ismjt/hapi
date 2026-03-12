import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Suggestion } from '@/hooks/useActiveSuggestions'
import { Autocomplete } from '@/components/ChatInput/Autocomplete'
import { FloatingOverlay } from '@/components/ChatInput/FloatingOverlay'
import { useTranslation } from '@/lib/use-translation'

function ClearIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    )
}

function truncatePath(path: string, maxLength: number = 25): string {
    if (path.length <= maxLength) return path

    // 分割路径为部分
    const parts = path.split('/')
    if (parts.length <= 2) {
        // 如果只有两部分或更少，直接截断
        return `${path.slice(0, Math.floor(maxLength / 2))}…${path.slice(-Math.floor(maxLength / 2) - 1)}`
    }

    // 保留首尾部分，中间用省略号
    const firstPart = parts[0]
    const lastPart = parts[parts.length - 1]

    // 计算中间可以保留的字符数
    const remaining = maxLength - firstPart.length - lastPart.length - 4 // 4 = "..." + "/"
    if (remaining <= 0) {
        return `${firstPart.slice(0, Math.floor(maxLength / 2))}…${lastPart.slice(-Math.floor(maxLength / 2) - 1)}`
    }

    // 取中间部分的子串
    const middleParts = parts.slice(1, -1)
    const middleStr = middleParts.join('/')

    if (middleStr.length <= remaining) {
        return `${firstPart}/${middleStr}/${lastPart}`
    }

    // 截断中间部分
    const middleTruncated = middleStr.length > remaining
        ? `${middleStr.slice(0, Math.floor(remaining / 2))}…${middleStr.slice(-Math.floor(remaining / 2) - 1)}`
        : middleStr

    return `${firstPart}/${middleTruncated}/${lastPart}`
}

export function DirectorySection(props: {
    directory: string
    suggestions: readonly Suggestion[]
    selectedIndex: number
    isDisabled: boolean
    recentPaths: string[]
    onDirectoryChange: (value: string) => void
    onDirectoryFocus: () => void
    onDirectoryBlur: () => void
    onDirectoryKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void
    onSuggestionSelect: (index: number) => void
    onPathClick: (path: string) => void
}) {
    const { t } = useTranslation()

    return (
        <div className="flex flex-col gap-1.5 px-3 py-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[var(--app-hint)]">
                    {t('newSession.directory')}
                </label>
                {props.directory && (
                    <button
                        type="button"
                        onClick={() => props.onDirectoryChange('')}
                        disabled={props.isDisabled}
                        className="flex h-5 w-5 items-center justify-center rounded text-[var(--app-hint)] hover:text-[var(--app-link)] hover:bg-[var(--app-subtle-bg)] disabled:opacity-50"
                        aria-label={t('button.clear')}
                        title={t('button.clear')}
                    >
                        <ClearIcon />
                    </button>
                )}
            </div>
            <div className="relative">
                <input
                    type="text"
                    placeholder={t('newSession.placeholder')}
                    value={props.directory}
                    onChange={(event) => props.onDirectoryChange(event.target.value)}
                    onKeyDown={props.onDirectoryKeyDown}
                    onFocus={props.onDirectoryFocus}
                    onBlur={props.onDirectoryBlur}
                    disabled={props.isDisabled}
                    className="w-full rounded-md border border-[var(--app-border)] bg-[var(--app-bg)] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-link)] disabled:opacity-50"
                />
                {props.suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1">
                        <FloatingOverlay maxHeight={200}>
                            <Autocomplete
                                suggestions={props.suggestions}
                                selectedIndex={props.selectedIndex}
                                onSelect={props.onSuggestionSelect}
                            />
                        </FloatingOverlay>
                    </div>
                )}
            </div>

            {props.recentPaths.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                    <span className="text-xs text-[var(--app-hint)]">{t('newSession.recent')}:</span>
                    <div className="flex flex-wrap gap-1">
                        {props.recentPaths.map((path) => {
                            const displayPath = truncatePath(path)
                            return (
                                <button
                                    key={path}
                                    type="button"
                                    onClick={() => props.onPathClick(path)}
                                    disabled={props.isDisabled}
                                    className="rounded bg-[var(--app-subtle-bg)] px-2 py-1 text-xs text-[var(--app-fg)] hover:bg-[var(--app-secondary-bg)] transition-colors truncate max-w-[200px] disabled:opacity-50"
                                    title={path}
                                >
                                    {displayPath}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
