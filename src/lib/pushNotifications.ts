import { supabase, pushApi } from './supabase'
import { getDeviceId } from './deviceId'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream as boolean
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  return Notification.requestPermission()
}

// ─── Resultado tipado — permite mostrar mensagem de erro específica na UI ───
export type PushSubscribeResult =
  | { ok: true }
  | {
      ok: false
      reason:
        | 'not_supported'      // navegador sem suporte a Push API
        | 'vapid_missing'      // VITE_VAPID_PUBLIC_KEY não configurada no servidor
        | 'permission_denied'  // usuário bloqueou a permissão
        | 'sw_not_ready'       // Service Worker não registrado / timeout
        | 'subscription_error' // falha na assinatura (rede, VAPID inválida, etc.)
    }

export async function subscribeToPush(): Promise<PushSubscribeResult> {
  // 1. Verifica suporte do navegador
  if (!isPushSupported()) {
    console.warn('[Push] Navegador sem suporte a Push Notifications')
    return { ok: false, reason: 'not_supported' }
  }

  // 2. Verifica chave VAPID — se ausente, o servidor não está configurado
  if (!VAPID_PUBLIC_KEY) {
    console.error('[Push] VITE_VAPID_PUBLIC_KEY não está configurada no servidor')
    return { ok: false, reason: 'vapid_missing' }
  }

  try {
    // 3. Solicita permissão ao usuário (mostra o diálogo nativo)
    const permission = await requestPushPermission()
    if (permission !== 'granted') {
      return { ok: false, reason: 'permission_denied' }
    }

    // 4. Aguarda o Service Worker estar pronto (timeout de 15 s)
    let reg: ServiceWorkerRegistration
    try {
      reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Service Worker timeout')), 15000),
        ),
      ]) as ServiceWorkerRegistration
    } catch (err) {
      console.error('[Push] Service Worker não está pronto:', err)
      return { ok: false, reason: 'sw_not_ready' }
    }

    // 5. Reutiliza inscrição existente, se houver
    const existing = await reg.pushManager.getSubscription()
    if (existing) {
      await pushApi.save(existing.toJSON() as PushSubscriptionJSON, getDeviceId())
      return { ok: true }
    }

    // 6. Cria nova inscrição push com a chave VAPID
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    await pushApi.save(sub.toJSON() as PushSubscriptionJSON, getDeviceId())
    return { ok: true }
  } catch (err) {
    console.error('[Push] Erro na inscrição:', err)
    return { ok: false, reason: 'subscription_error' }
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await pushApi.remove(sub.endpoint)
      await sub.unsubscribe()
    }
  } catch (err) {
    console.error('[Push] unsubscribe error:', err)
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return sub !== null
  } catch {
    return false
  }
}

// ─── Notificação genérica — funciona para devocionais, avisos, relatórios ──
export async function sendNotification(params: {
  title: string
  body: string
  targetUrl?: string
  devotionalId?: string
}): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: {
      title: params.title,
      body: params.body,
      url: params.targetUrl ?? '/app',
      devotionalId: params.devotionalId ?? null,
    },
  })
  if (error) throw error
}

// ─── Compat. retroativa — mantém chamadas existentes funcionando ─────────────
export async function sendPushNotification(devotionalId: string, title: string): Promise<void> {
  return sendNotification({
    title,
    body: 'Nova devocional disponível. Toque para ler.',
    targetUrl: `/app/devocional/${devotionalId}`,
    devotionalId,
  })
}
