import { useState, useRef, useEffect } from 'react'
import { CloseIcon, PlusIcon } from '@/components/icons'
import { useTranslation } from '@/lib/use-translation'
import type { StoredQuickCommand } from '@/hooks/useQuickCommands'

interface QuickCommandsOverlayProps {
    commands: StoredQuickCommand[]
    onAddCommand: (text: string) => Promise<boolean>
    onDeleteCommand: (id: string) => void
    onSelectCommand: (text: string) => void
    onClose: () => void
}

export function QuickCommandsOverlay({
    commands,
    onAddCommand,
    onDeleteCommand,
    onSelectCommand,
    onClose
}: QuickCommandsOverlayProps) {
    const { t } = useTranslation()
    const [inputValue, setInputValue] = useState('')
    const [showAddInput, setShowAddInput] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [addError, setAddError] = useState<string>('')
    const inputRef = useRef<HTMLInputElement>(null)

    const toggleAddInput = () => {
        const newState = !showAddInput
        setShowAddInput(newState)
        if (newState) {
            setTimeout(() => inputRef.current?.focus(), 0)
        }
    }

    const handleSave = async () => {
        const trimmed = inputValue.trim()
        if (!trimmed) return

        setIsSaving(true)
        setAddError('')
        try {
            const success = await onAddCommand(trimmed)
            if (success) {
                setInputValue('')
                setShowAddInput(false)
            } else {
                setAddError(t('composer.quickCommands.addFailed'))
            }
        } catch {
            setAddError(t('composer.quickCommands.addError'))
        } finally {
            setIsSaving(false)
        }
    }

    const handleCommandClick = (text: string) => {
        onSelectCommand(text)
        onClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose()
        }
    }

    return (
        <div
            className="absolute bottom-full right-0 mb-2 w-full max-h-[50vh] overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-bg)] shadow-lg"
            onKeyDown={handleKeyDown}
        >
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-3 py-2">
                <h3 className="text-sm font-semibold text-[var(--app-fg)]">
                    {t('composer.quickCommands.title')}
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={toggleAddInput}
                        className={`shrink-0 rounded p-1 transition-colors ${
                            showAddInput
                                ? 'bg-blue-500 text-white'
                                : 'text-[var(--app-hint)] hover:bg-[var(--app-subtle-bg)] hover:text-[var(--app-fg)]'
                        }`}
                        title={t('composer.quickCommands.addNew')}
                    >
                        <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded p-1 text-[var(--app-hint)] hover:bg-[var(--app-subtle-bg)] hover:text-[var(--app-fg)] transition-colors"
                        title={t('button.close')}
                    >
                        <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* 添加命令输入框 */}
            {showAddInput && (
                <div className="p-3 border-b border-[var(--app-divider)]">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value)
                                setAddError('')
                            }}
                            placeholder={t('composer.quickCommands.placeholder')}
                            className="flex-1 px-3 py-2 text-sm border border-[var(--app-border)] rounded-md bg-[var(--app-input-bg)] text-[var(--app-fg)] placeholder:text-[var(--app-hint)] focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)] focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!inputValue.trim() || isSaving}
                            className="px-3 py-2 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSaving ? t('misc.loading') : t('button.add')}
                        </button>
                    </div>
                    {/* 错误提示 */}
                    {addError && (
                        <div className="mt-2 text-xs text-red-500">
                            {addError}
                        </div>
                    )}
                </div>
            )}

            {/* 命令列表 */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(50vh - 120px)' }}>
                {commands.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-[var(--app-hint)]">
                        {t('composer.quickCommands.empty')}
                    </div>
                ) : (
                    <ul className="divide-y divide-[var(--app-divider)]">
                        {commands.map((command) => (
                            <li
                                key={command.id}
                                className="group flex items-center gap-2 px-3 py-2 hover:bg-[var(--app-subtle-bg)] transition-colors"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleCommandClick(command.text)}
                                    className="flex-1 text-left text-sm text-[var(--app-fg)] truncate"
                                    title={command.text}
                                >
                                    {command.text}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDeleteCommand(command.id)}
                                    className="shrink-0 rounded p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    title={t('button.delete')}
                                >
                                    <CloseIcon className="h-3 w-3" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
