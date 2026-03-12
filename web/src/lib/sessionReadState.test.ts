import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    getSessionReadState,
    markSessionReadInState,
    persistSessionReadState,
    isSessionUnread,
} from './sessionReadState'

describe('sessionReadState', () => {
    const STORAGE_KEY = 'hapi-session-read-state'

    beforeEach(() => {
        localStorage.clear()
    })

    describe('getSessionReadState', () => {
        it('当 localStorage 为空时应返回空对象', () => {
            expect(getSessionReadState()).toEqual({})
        })

        it('应解析有效的 JSON 状态', () => {
            const state = { 'session-1': 1234567890 }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
            expect(getSessionReadState()).toEqual(state)
        })

        it('应处理无效的 JSON', () => {
            localStorage.setItem(STORAGE_KEY, 'invalid json')
            expect(getSessionReadState()).toEqual({})
        })

        it('应处理非对象值', () => {
            localStorage.setItem(STORAGE_KEY, '[]')
            expect(getSessionReadState()).toEqual({})
        })
    })

    describe('markSessionReadInState', () => {
        it('应添加新的会话读取时间戳', () => {
            const state: Record<string, number> = {}
            const result = markSessionReadInState(state, 'session-1', 1234567890)
            expect(result).toEqual({ 'session-1': 1234567890 })
        })

        it('应更新现有会话的读取时间戳', () => {
            const state = { 'session-1': 1234567890 }
            const result = markSessionReadInState(state, 'session-1', 9999999999)
            expect(result).toEqual({ 'session-1': 9999999999 })
        })

        it('应保持不可变性', () => {
            const state = { 'session-1': 1234567890 }
            const result = markSessionReadInState(state, 'session-2', 2222222222)
            expect(result).not.toBe(state)
            expect(state).toEqual({ 'session-1': 1234567890 })
            expect(result).toEqual({
                'session-1': 1234567890,
                'session-2': 2222222222,
            })
        })
    })

    describe('persistSessionReadState', () => {
        it('应将状态保存到 localStorage', () => {
            const state = { 'session-1': 1234567890 }
            persistSessionReadState(state)
            expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(state))
        })

        it('应限制存储的会话数量', () => {
            const state: Record<string, number> = {}
            // 创建 600 个会话
            for (let i = 0; i < 600; i++) {
                state[`session-${i}`] = Date.now() - i * 1000
            }
            persistSessionReadState(state)
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
            expect(Object.keys(saved).length).toBe(500)
        })

        it('应保留最近读取的会话', () => {
            const state: Record<string, number> = {
                'old-session': 1000000,
                'recent-1': 3000000,
                'recent-2': 2000000,
            }
            persistSessionReadState(state)
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
            // 应保留所有 3 个（小于 MAX_STORED_SESSIONS）
            expect(Object.keys(saved).length).toBe(3)
            expect(saved['old-session']).toBeDefined()
        })

        it('应处理 localStorage 错误', () => {
            const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
                throw new Error('Storage quota exceeded')
            })
            const state = { 'session-1': 1234567890 }
            expect(() => persistSessionReadState(state)).not.toThrow()
            setItemSpy.mockRestore()
        })
    })

    describe('isSessionUnread', () => {
        it('当会话没有 updatedAt 时应返回 false', () => {
            const session = { id: 'session-1' } as any
            const readState = {}
            expect(isSessionUnread(session, readState)).toBe(false)
        })

        it('当会话从未被读取时应返回 true', () => {
            const session = { id: 'session-1', updatedAt: 1234567890 } as any
            const readState = {}
            expect(isSessionUnread(session, readState)).toBe(true)
        })

        it('当会话有新更新时应返回 true', () => {
            const session = { id: 'session-1', updatedAt: 2000000000 } as any
            const readState = { 'session-1': 1234567890 }
            expect(isSessionUnread(session, readState)).toBe(true)
        })

        it('当会话已被读取时应返回 false', () => {
            const session = { id: 'session-1', updatedAt: 1234567890 } as any
            const readState = { 'session-1': 1234567890 }
            expect(isSessionUnread(session, readState)).toBe(false)
        })

        it('当读取时间戳等于更新时间时应返回 false', () => {
            const session = { id: 'session-1', updatedAt: 1234567890 } as any
            const readState = { 'session-1': 1234567890 }
            expect(isSessionUnread(session, readState)).toBe(false)
        })
    })
})
