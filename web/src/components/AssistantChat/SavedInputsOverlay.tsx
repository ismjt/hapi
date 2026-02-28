import type { SavedInput } from '@/hooks/useSavedInputs'
import { useTranslation } from '@/lib/use-translation'

function ClockIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}

function TrashIcon() {
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
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    )
}

function formatRelativeTime(timestamp: number): string {
    const delta = Date.now() - timestamp
    const minutes = Math.floor(delta / 60_000)
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}天前`
    return new Date(timestamp).toLocaleDateString()
}

export function SavedInputsOverlay(props: {
    inputs: SavedInput[]
    onSelect: (text: string) => void
    onDelete: (id: string) => void
    onClose: () => void
}) {
    const { t } = useTranslation()
    const { inputs, onSelect, onDelete, onClose } = props

    if (inputs.length === 0) {
        return (
            <div className="absolute bottom-[100%] mb-2 w-full">
                <div className="mx-2 rounded-xl bg-[var(--app-bg)] shadow-lg border border-[var(--app-border)] p-4">
                    <div className="text-center text-sm text-[var(--app-hint)]">
                        {t('composer.noSavedInputs')}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="absolute bottom-[100%] mb-2 w-full">
            <div className="mx-2 rounded-xl bg-[var(--app-bg)] shadow-lg border border-[var(--app-border)] max-h-64 overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--app-border)]">
                    <div className="text-xs font-semibold text-[var(--app-hint)]">
                        {t('composer.savedInputs')}
                    </div>
                </div>
                <div className="overflow-y-auto max-h-52">
                    {inputs.map((input) => (
                        <div
                            key={input.id}
                            className="flex items-start gap-2 px-3 py-2 hover:bg-[var(--app-secondary-bg)] transition-colors"
                        >
                            <button
                                type="button"
                                className="flex-1 text-left"
                                onClick={() => {
                                    onSelect(input.text)
                                    onClose()
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <div className="text-sm text-[var(--app-fg)] line-clamp-2 break-words">
                                    {input.text}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-[var(--app-hint)]">
                                    <ClockIcon />
                                    <span>{formatRelativeTime(input.createdAt)}</span>
                                </div>
                            </button>
                            <button
                                type="button"
                                className="flex-shrink-0 p-1 rounded text-[var(--app-hint)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                onClick={() => onDelete(input.id)}
                                title={t('composer.deleteInput')}
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
