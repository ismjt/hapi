/**
 * 通知设置 Hook
 *
 * 管理会话通知设置的 React Hook
 */

import { useState, useEffect, useCallback } from 'react'
import type { ApiClient } from '@/api/client'

export interface NotificationSettings {
    enabled: boolean
    wecomWebhook: string | null
}

export interface GlobalNotificationConfig {
    hasGlobalWecomWebhook: boolean
}

// 全局配置缓存
let globalConfigCache: GlobalNotificationConfig | null = null

/**
 * 检查是否配置了全局企业微信 Webhook
 * 这是一个同步函数，使用缓存的配置
 */
export function hasWecomWebhook(): boolean {
    return globalConfigCache?.hasGlobalWecomWebhook ?? false
}

/**
 * 刷新全局配置缓存
 */
export async function refreshGlobalConfig(api: ApiClient | null): Promise<void> {
    if (!api) return
    try {
        const config = await api.getNotificationConfig()
        globalConfigCache = config
    } catch (error) {
        console.error('[useNotificationSettings] Failed to refresh global config:', error)
    }
}

/**
 * 通知设置 Hook
 */
export function useNotificationSettings(
    api: ApiClient | null,
    sessionId: string
): {
    settings: NotificationSettings
    globalConfig: GlobalNotificationConfig
    canEnableNotification: boolean
    isLoading: boolean
    toggleEnabled: () => Promise<boolean>
    setWebhook: (url: string) => Promise<boolean>
    refreshSettings: () => Promise<void>
    updateGlobalWebhook: (wecomWebhook: string) => Promise<void>
} {
    const [settings, setSettings] = useState<NotificationSettings>({
        enabled: false,
        wecomWebhook: null
    })
    const [globalConfig, setGlobalConfig] = useState<GlobalNotificationConfig>({
        hasGlobalWecomWebhook: false
    })
    const [isLoading, setIsLoading] = useState(false)

    // 判断是否可以启用通知
    const canEnableNotification = globalConfig.hasGlobalWecomWebhook || Boolean(settings.wecomWebhook)

    // 加载设置
    const loadSettings = useCallback(async () => {
        if (!api || !sessionId) return

        setIsLoading(true)
        try {
            // 并行加载全局配置和会话设置
            const [configResponse, settingsResponse] = await Promise.all([
                api.getNotificationConfig(),
                api.getSessionNotificationSettings(sessionId)
            ])

            globalConfigCache = configResponse
            setGlobalConfig(configResponse)
            setSettings(settingsResponse)
        } catch (error) {
            console.error('[useNotificationSettings] Failed to load settings:', error)
        } finally {
            setIsLoading(false)
        }
    }, [api, sessionId])

    // 初始加载
    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    // 切换通知启用状态
    const toggleEnabled = useCallback(async (): Promise<boolean> => {
        if (!api || !sessionId) return false

        const newEnabled = !settings.enabled
        try {
            await api.updateSessionNotificationSettings(sessionId, {
                enabled: newEnabled
            })
            setSettings(prev => ({ ...prev, enabled: newEnabled }))
            return true
        } catch (error) {
            console.error('[useNotificationSettings] Failed to toggle enabled:', error)
            return false
        }
    }, [api, sessionId, settings.enabled])

    // 设置会话级 Webhook
    const setWebhook = useCallback(async (url: string): Promise<boolean> => {
        if (!api || !sessionId) return false

        try {
            await api.updateSessionNotificationSettings(sessionId, {
                wecomWebhook: url || null
            })
            setSettings(prev => ({ ...prev, wecomWebhook: url || null }))
            return true
        } catch (error) {
            console.error('[useNotificationSettings] Failed to set webhook:', error)
            return false
        }
    }, [api, sessionId])

    // 更新全局 Webhook
    const updateGlobalWebhook = useCallback(async (wecomWebhook: string): Promise<void> => {
        if (!api) return

        await api.updateGlobalWecomWebhook(wecomWebhook)
        // 刷新全局配置缓存
        globalConfigCache = null
        await loadSettings()
    }, [api, loadSettings])

    return {
        settings,
        globalConfig,
        canEnableNotification,
        isLoading,
        toggleEnabled,
        setWebhook,
        refreshSettings: loadSettings,
        updateGlobalWebhook,
    }
}
