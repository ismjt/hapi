/**
 * 快捷命令 Hook
 *
 * 管理会话快捷命令的 React Hook，数据存储在后端数据库中。
 * 采用按需加载策略，只有调用 refresh 时才加载数据。
 */

import { useState, useCallback } from 'react'
import type { ApiClient } from '@/api/client'
import type { QuickCommand } from '@/types/api'

const MAX_QUICK_COMMANDS = 20

export interface StoredQuickCommand {
    id: string
    text: string
    createdAt: number
}

/**
 * 快捷命令 Hook
 *
 * 数据加载时机：只有调用 refresh() 方法时才从后端加载数据
 * 组件挂载时不会自动加载
 */
export function useQuickCommands(
    api: ApiClient | null,
    sessionId: string | undefined
): {
    commands: StoredQuickCommand[]
    addCommand: (text: string) => Promise<boolean>
    deleteCommand: (id: string) => Promise<void>
    clearAll: () => Promise<void>
    isEmpty: boolean
    isLoading: boolean
    refresh: () => Promise<void>
} {
    const [commands, setCommands] = useState<StoredQuickCommand[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // 加载快捷命令（按需调用，不会自动执行）
    const loadCommands = useCallback(async () => {
        if (!api || !sessionId) {
            setCommands([])
            return
        }

        setIsLoading(true)
        try {
            const response = await api.getQuickCommands(sessionId)
            setCommands(response.commands.map(cmd => ({
                id: cmd.id,
                text: cmd.text,
                createdAt: cmd.createdAt
            })))
        } catch (error) {
            console.error('[useQuickCommands] Failed to load commands:', error)
            setCommands([])
        } finally {
            setIsLoading(false)
        }
    }, [api, sessionId])

    // 添加快捷命令
    const addCommand = useCallback(async (text: string): Promise<boolean> => {
        if (!api || !sessionId) return false

        const trimmed = text.trim()
        if (!trimmed) return false

        // 检查是否已存在相同内容
        if (commands.some(cmd => cmd.text === trimmed)) {
            return false
        }

        // 检查数量限制
        if (commands.length >= MAX_QUICK_COMMANDS) {
            return false
        }

        try {
            const response = await api.createQuickCommand(sessionId, trimmed)
            if (response.ok) {
                const newCommand: StoredQuickCommand = {
                    id: response.command.id,
                    text: response.command.text,
                    createdAt: response.command.createdAt
                }
                setCommands(prev => [newCommand, ...prev])
                return true
            }
            return false
        } catch (error) {
            console.error('[useQuickCommands] Failed to add command:', error)
            return false
        }
    }, [api, sessionId, commands])

    // 删除快捷命令
    const deleteCommand = useCallback(async (id: string) => {
        if (!api || !sessionId) return

        try {
            await api.deleteQuickCommand(sessionId, id)
            setCommands(prev => prev.filter(cmd => cmd.id !== id))
        } catch (error) {
            console.error('[useQuickCommands] Failed to delete command:', error)
        }
    }, [api, sessionId])

    // 清空所有命令
    const clearAll = useCallback(async () => {
        if (!api || !sessionId) return

        // 逐个删除所有命令
        const deletePromises = commands.map(cmd => api.deleteQuickCommand(sessionId, cmd.id))
        try {
            await Promise.all(deletePromises)
            setCommands([])
        } catch (error) {
            console.error('[useQuickCommands] Failed to clear commands:', error)
        }
    }, [api, sessionId, commands])

    return {
        commands,
        addCommand,
        deleteCommand,
        clearAll,
        isEmpty: commands.length === 0,
        isLoading,
        refresh: loadCommands
    }
}
