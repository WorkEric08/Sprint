/**
 * Sistema de notificações locais para o Sprint.
 *
 * LIMITAÇÕES IMPORTANTES:
 * ─────────────────────────────────────────────────────────────────────────
 * Este app não tem servidor de push. As notificações funcionam via
 * Notification API local, que tem comportamento diferente por plataforma:
 *
 * ✅ Funciona:
 *   - App aberto/em foreground → sempre
 *   - PWA instalado (Chrome/Edge Android) → enquanto service worker ativo
 *   - PWA instalado (iOS Safari 16.4+) → com o app "ao fundo"
 *
 * ⚠️ Não garante:
 *   - App completamente fechado sem push server
 *   - Múltiplos dispositivos do mesmo usuário (sem servidor)
 *   - Firefox (não suporta Notification API em PWA)
 *
 * ESTRATÉGIA: verificar e disparar notificações relevantes ao ABRIR o app.
 * Notificações "perdidas" (app estava fechado) são detectadas pelo timestamp
 * e disparadas quando o usuário abre o app com delay mínimo.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NotificationSettings, ReviewItem, SimuladoRecord } from '../types';
import { isPendingNow } from '../utils/reviewAlgorithm';
import { toLocalDateKey, todayKey } from '../utils/dateUtils';

// Key prefix in settings for tracking last notification timestamps
const NOTIF_KEY = 'last_notif_';

function todayLocalHour(): number {
  return new Date().getHours();
}

function fridayToday(): boolean {
  return new Date().getDay() === 5;
}

function daysBetweenNow(ts: number): number {
  return Math.round((Date.now() - ts) / 86_400_000);
}

function daysUntil(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const todayMidnight = (() => { const t = new Date(); t.setHours(0,0,0,0); return t.getTime(); })();
  return Math.round((target - todayMidnight) / 86_400_000);
}

// Read last fired timestamp from localStorage
function getLastFired(key: string): number {
  return Number(localStorage.getItem(NOTIF_KEY + key) ?? '0');
}

// Mark as fired today
function markFired(key: string): void {
  localStorage.setItem(NOTIF_KEY + key, String(Date.now()));
}

// Check if already fired today (local date)
function firedToday(key: string): boolean {
  const last = getLastFired(key);
  if (!last) return false;
  return toLocalDateKey(last) === todayKey();
}

// Show notification via Notification API
async function showNotification(title: string, body: string, tag: string): Promise<void> {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, { body, tag, icon: '/icon.svg', badge: '/icon.svg' });
        return;
      }
    }
    new Notification(title, { body, tag, icon: '/icon.svg' });
  } catch (e) {
    console.warn('Notification failed:', e);
  }
}

export interface NotifContext {
  settings: NotificationSettings;
  pendingReviews: ReviewItem[];
  completedBlocksToday: number;
  streakDays: number;
  lastSimulado: SimuladoRecord | null;
  examDate: string | null;
  examName: string | null;
}

/**
 * Main entry point — call on app mount and on visibility change.
 * Checks all notification conditions and fires relevant ones.
 */
export async function checkAndFireNotifications(ctx: NotifContext): Promise<void> {
  if (!ctx.settings.enabled) return;
  if (Notification.permission !== 'granted') return;

  const hour = todayLocalHour();
  const pendingCount = ctx.pendingReviews.filter(r => isPendingNow(r)).length;

  // 1. Morning review (7h–11h) — only if there are pending reviews
  if (ctx.settings.morningReview && hour >= 7 && hour < 11 && pendingCount > 0 && !firedToday('morning_review')) {
    await showNotification(
      'Sprint — Revisões Pendentes',
      `Você tem ${pendingCount} ${pendingCount === 1 ? 'revisão pendente' : 'revisões pendentes'} para hoje.`,
      'morning_review',
    );
    markFired('morning_review');
  }

  // 2. Evening streak (18h–22h) — only if studied today and streak active
  if (ctx.settings.eveningStreak && hour >= 18 && hour < 22 && ctx.streakDays > 0 && ctx.completedBlocksToday > 0 && !firedToday('evening_streak')) {
    await showNotification(
      'Sprint — Sequência ativa 🔥',
      `${ctx.completedBlocksToday} bloco${ctx.completedBlocksToday > 1 ? 's' : ''} hoje. ${ctx.streakDays} dias de sequência. Continue amanhã!`,
      'evening_streak',
    );
    markFired('evening_streak');
  }

  // 3. Weekend simulado (sexta, 14h+) — only if no simulado in last 7 days
  if (ctx.settings.weekendSimulado && fridayToday() && hour >= 14 && !firedToday('weekend_simulado')) {
    const lastSimuladoDays = ctx.lastSimulado ? daysBetweenNow(ctx.lastSimulado.completedAt) : 999;
    if (lastSimuladoDays >= 7) {
      await showNotification(
        'Sprint — Simulado no fim de semana?',
        'Faz 7+ dias sem simulado. Que tal praticar amanhã com tempo de sobra?',
        'weekend_simulado',
      );
      markFired('weekend_simulado');
    }
  }

  // 4. Exam proximity alerts
  if (ctx.settings.examProximity && ctx.examDate) {
    const days = daysUntil(ctx.examDate);
    const PROXIMITY_THRESHOLDS = [90, 60, 30, 14, 7, 3, 1];
    for (const threshold of PROXIMITY_THRESHOLDS) {
      const key = `exam_prox_${threshold}`;
      if (days === threshold && !firedToday(key)) {
        await showNotification(
          `Sprint — ${days} ${days === 1 ? 'dia' : 'dias'} para ${ctx.examName ?? 'a prova'}`,
          days <= 7
            ? 'Foco total! Revise pontos críticos e simule condições reais.'
            : days <= 30
            ? 'Intensifique as questões e simulados agora.'
            : 'Organize seu ciclo de estudos para as próximas semanas.',
          key,
        );
        markFired(key);
        break;
      }
    }
  }

  // 5. Streak risk (after 22h, opt-in) — user has no blocks today but had streak
  if (ctx.settings.streakRisk && hour >= 22 && ctx.streakDays > 0 && ctx.completedBlocksToday === 0 && !firedToday('streak_risk')) {
    await showNotification(
      'Sprint — Sequência em risco ⚠️',
      `Faltam poucas horas. Faça 1 bloco para manter sua sequência de ${ctx.streakDays} dias!`,
      'streak_risk',
    );
    markFired('streak_risk');
  }
}

/** Request notification permission — call from settings UI. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  morningReview: true,
  eveningStreak: true,
  weekendSimulado: true,
  examProximity: true,
  streakRisk: false, // opt-in: off by default
};
