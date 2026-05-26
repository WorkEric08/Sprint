/**
 * Definições das conquistas do Sprint.
 *
 * PRINCÍPIO DE DESIGN:
 * - Baseadas em comportamento real, não métricas vazias
 * - Visual sóbrio: ícone + label, sem animação celebratória
 * - Copy positiva: conquista é reconhecimento, nunca cobrança
 * - Ocultas até desbloquear: não mostrar como "trancadas"
 *
 * CURADORIA HUMANA OBRIGATÓRIA:
 * Labels, descrições e ícones aqui são propostas — revisar antes de lançar.
 * O tom de cada conquista deve ser acolhedor e não-condescendente.
 */

import { AchievementId } from '../types';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;       // copy da notificação ao desbloquear
  detail: string;            // descrição do critério (para a lista de conquistas)
  icon: string;              // fa icon class
  /** Recompensa funcional opcional — undefined = sem recompensa */
  reward?: string;
}

export const ACHIEVEMENT_DEFS: Record<AchievementId, AchievementDef> = {
  'first-block': {
    id: 'first-block',
    title: 'Primeiro passo',
    description: 'Você concluiu seu primeiro bloco de estudo.',
    detail: 'Concluir o primeiro bloco.',
    icon: 'fa-seedling',
  },
  'first-week': {
    id: 'first-week',
    title: 'Primeira semana',
    description: '7 dias de estudo. O hábito está se formando.',
    detail: '7 dias de estudo registrados.',
    icon: 'fa-calendar-week',
  },
  'mil-questoes': {
    id: 'mil-questoes',
    title: 'Mil questões',
    description: '1.000 questões registradas. Prática real em escala.',
    detail: '1.000 questões resolvidas no total.',
    icon: 'fa-layer-group',
  },
  'consistencia': {
    id: 'consistencia',
    title: 'Consistência',
    description: '30 dias de estudo nos últimos 35. Isso é disciplina de verdade.',
    detail: '30 ou mais dias estudados em qualquer janela de 35 dias.',
    icon: 'fa-chart-line',
  },
  'volta-por-cima': {
    id: 'volta-por-cima',
    title: 'Volta por cima',
    description: 'Sua nota em redação subiu 100 pontos ao longo do tempo.',
    detail: 'Ganhar 100+ pontos em redação entre a primeira e a mais recente avaliação.',
    icon: 'fa-arrow-trend-up',
    reward: 'Desbloqueou: cor violeta para o Caderno de Erros',
  },
  'maratonista': {
    id: 'maratonista',
    title: 'Maratonista',
    description: 'Simulado completo de 5h sem interrupção. Resistência mental de verdade.',
    detail: 'Completar um simulado de ≥5h sem encerrar antes do tempo.',
    icon: 'fa-stopwatch',
  },
  'detalhista': {
    id: 'detalhista',
    title: 'Detalhista',
    description: '50 blocos com subtópico registrado. Granularidade que faz diferença.',
    detail: '50 ou mais blocos registrados com subtópico preenchido.',
    icon: 'fa-tags',
  },
};

/** Ordered list for display (not locked ones never shown). */
export const ACHIEVEMENT_ORDER: AchievementId[] = [
  'first-block',
  'first-week',
  'mil-questoes',
  'consistencia',
  'detalhista',
  'maratonista',
  'volta-por-cima',
];
