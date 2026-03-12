import { describe, expect, it } from 'vitest'
import { getSessionTitle } from './sessionTitle'

describe('getSessionTitle', () => {
    it('优先使用手动设置的会话名称', () => {
        expect(getSessionTitle({
            id: 'session-1',
            metadata: {
                path: '/root/project-a',
                name: '手动设置的名称'
            }
        })).toBe('手动设置的名称')
    })

    it('当启用自动标题时使用AI生成的摘要文本', () => {
        expect(getSessionTitle({
            id: 'session-1',
            metadata: {
                path: '/root/project-a',
                summary: {
                    text: 'AI生成的标题',
                    updatedAt: 1
                }
            }
        }, { allowGeneratedTitle: true })).toBe('AI生成的标题')
    })

    it('当禁用自动标题时忽略AI生成的摘要文本', () => {
        expect(getSessionTitle({
            id: 'session-1',
            metadata: {
                path: '/root/project-a',
                summary: {
                    text: 'AI生成的标题',
                    updatedAt: 1
                }
            }
        }, { allowGeneratedTitle: false })).toBe('project-a')
    })

    it('当没有路径时使用会话ID的前8位', () => {
        expect(getSessionTitle({
            id: 'abc123def456',
            metadata: null
        })).toBe('abc123de')
    })

    it('默认情况下允许使用AI生成的标题', () => {
        expect(getSessionTitle({
            id: 'session-1',
            metadata: {
                path: '/root/project-a',
                summary: {
                    text: 'AI生成的标题',
                    updatedAt: 1
                }
            }
        })).toBe('AI生成的标题')
    })
})
