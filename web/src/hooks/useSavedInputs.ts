import { useCallback, useEffect, useState } from 'react'

const SAVED_INPUTS_PREFIX = 'hapi_saved_inputs_'
const MAX_SAVED_INPUTS = 10

export type SavedInput = {
    id: string
    text: string
    createdAt: number
    sessionId?: string
}

export function useSavedInputs(sessionId?: string | null) {
    const [savedInputs, setSavedInputs] = useState<SavedInput[]>([])

    // 生成当前会话的存储键
    const storageKey = sessionId ? `${SAVED_INPUTS_PREFIX}${sessionId}` : SAVED_INPUTS_PREFIX

    // 当 sessionId 变化时，清空当前状态并重新加载
    useEffect(() => {
        setSavedInputs([])
        try {
            const stored = localStorage.getItem(storageKey)
            if (stored) {
                const parsed = JSON.parse(stored) as SavedInput[]
                if (Array.isArray(parsed)) {
                    setSavedInputs(parsed)
                }
            }
        } catch {
            // 忽略存储错误
        }
    }, [storageKey])

    // 保存到 localStorage
    const persistInputs = useCallback((inputs: SavedInput[]) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(inputs))
        } catch {
            // 忽略存储错误
        }
    }, [storageKey])

    // 保存新输入
    const saveInput = useCallback((text: string): boolean => {
        if (!text.trim()) return false

        const newInput: SavedInput = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            text: text.trim(),
            createdAt: Date.now(),
            sessionId: sessionId ?? undefined
        }

        setSavedInputs(prev => {
            // 检查是否已存在相同内容
            if (prev.some(input => input.text === newInput.text)) {
                return prev
            }
            // 添加新输入，保持在最大数量限制内
            const newInputs = [newInput, ...prev].slice(0, MAX_SAVED_INPUTS)
            persistInputs(newInputs)
            return newInputs
        })
        return true
    }, [persistInputs, sessionId])

    // 删除输入
    const deleteInput = useCallback((id: string) => {
        setSavedInputs(prev => {
            const newInputs = prev.filter(input => input.id !== id)
            persistInputs(newInputs)
            return newInputs
        })
    }, [persistInputs])

    // 清空所有
    const clearAll = useCallback(() => {
        setSavedInputs([])
        try {
            localStorage.removeItem(storageKey)
        } catch {
            // 忽略存储错误
        }
    }, [storageKey])

    return {
        savedInputs,
        saveInput,
        deleteInput,
        clearAll
    }
}
