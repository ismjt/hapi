import { useCallback } from 'react'
import { useTranslation } from '@/lib/use-translation'

interface GeneratedTitleToggleProps {
    enabled: boolean
    isDisabled?: boolean
    onToggle: (enabled: boolean) => void
}

export function GeneratedTitleToggle(props: GeneratedTitleToggleProps) {
    const { t } = useTranslation()
    const { enabled, isDisabled, onToggle } = props

    const handleToggle = useCallback(() => {
        onToggle(!enabled)
    }, [enabled, onToggle])

    return (
        <div className="flex flex-col gap-2 px-3 py-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-[var(--app-hint)] ${isDisabled ? 'opacity-50' : ''}`}
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <path d="M8 10h.01" />
                        <path d="M12 10h.01" />
                        <path d="M16 10h.01" />
                    </svg>
                    <span className={`text-[var(--app-fg)] ${isDisabled ? 'opacity-50' : ''}`}>
                        {t('session.generatedTitle.enable')}
                    </span>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={isDisabled}
                    onClick={handleToggle}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-link)] ${
                        enabled ? 'bg-[#22c55e]' : 'bg-[var(--app-border)]'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
            <p className="text-xs text-[var(--app-hint)]">
                {t('session.generatedTitle.description')}
            </p>
        </div>
    )
}
