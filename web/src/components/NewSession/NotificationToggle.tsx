import { useCallback } from 'react'
import { useTranslation } from '@/lib/use-translation'
import { hasWecomWebhook } from '@/hooks/useNotificationSettings'

interface NotificationToggleProps {
    enabled: boolean
    isDisabled?: boolean
    onToggle: (enabled: boolean) => void
}

export function NotificationToggle(props: NotificationToggleProps) {
    const { t } = useTranslation()
    const { enabled, isDisabled, onToggle } = props

    const hasGlobalWebhook = hasWecomWebhook()
    const canEnableNotification = hasGlobalWebhook

    const handleToggle = useCallback(() => {
        if (!canEnableNotification) {
            return
        }
        onToggle(!enabled)
    }, [canEnableNotification, enabled, onToggle])

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
                        className={`text-[var(--app-hint)] ${!canEnableNotification ? 'opacity-50' : ''}`}
                    >
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    <span className={`text-[var(--app-fg)] ${!canEnableNotification ? 'opacity-50' : ''}`}>
                        {t('session.notification.subscribe')}
                    </span>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={!canEnableNotification || isDisabled}
                    onClick={handleToggle}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-link)] ${
                        enabled ? 'bg-[#22c55e]' : 'bg-[var(--app-border)]'
                    } ${!canEnableNotification || isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
            {!canEnableNotification && (
                <p className="text-xs text-[var(--app-hint)]">
                    {t('session.notification.notConfigured')}
                </p>
            )}
        </div>
    )
}
