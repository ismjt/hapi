import { useCallback, useEffect, useState } from 'react'

const DRAFT_STORAGE_KEY = 'hapi_composer_draft'

export function useComposerDraft(sessionId: string | null) {
    const [draft, setDraft] = useState<string>('')

    // 加载草稿
    useEffect(() => {
        if (!sessionId) return
        try {
            const stored = localStorage.getItem(`${DRAFT_STORAGE_KEY}_${sessionId}`)
            if (stored) {
                setDraft(stored)
            }
        } catch {
            // 忽略存储错误
        }
    }, [sessionId])

    // 保存草稿
    const saveDraft = useCallback((text: string) => {
        setDraft(text)
        if (!sessionId) return
        try {
            if (text.trim()) {
                localStorage.setItem(`${DRAFT_STORAGE_KEY}_${sessionId}`, text)
            } else {
                localStorage.removeItem(`${DRAFT_STORAGE_KEY}_${sessionId}`)
            }
        } catch {
            // 忽略存储错误
        }
    }, [sessionId])

    // 清除草稿
    const clearDraft = useCallback(() => {
        setDraft('')
        if (!sessionId) return
        try {
            localStorage.removeItem(`${DRAFT_STORAGE_KEY}_${sessionId}`)
        } catch {
            // 忽略存储错误
        }
    }, [sessionId])

    return {
        draft,
        saveDraft,
        clearDraft
    }
}
