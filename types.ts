
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ── Feature 4 (Fase 2): Tipos de bloco ───────────────────────────────────

export type BlockType = 'study' | 'review' | 'questions';

export interface CompletedBlock {
  timestamp: number;
  type: BlockType;
}

export const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  study:     '#6366f1', // indigo — replaced by subject.color at render time
  review:    '#f59e0b', // amber
  questions: '#22c55e', // green
};

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  study:     'Estudo',
  review:    'Revisão',
  questions: 'Questões',
};

// ── Feature 1 (Fase 1): Modal pós-bloco ──────────────────────────────────

export interface PostBlockData {
  questionsTotal: number;
  questionsCorrect: number;
  subtopic: string;
  selfScore: 1 | 2 | 3 | 4 | 5;
  flaggedForReview: boolean;
  banca?: string; // Fase 5: Feature 2 — sempre opcional
}

export interface BlockLog {
  id: string;
  subjectId: string;
  subjectTitle: string;
  subjectColor: string;
  timestamp: number;
  questionsTotal: number;
  questionsCorrect: number;
  subtopic: string;
  selfScore: 1 | 2 | 3 | 4 | 5;
  flaggedForReview: boolean;
  blockType: BlockType;
  banca?: string; // Fase 5: Feature 2 — sempre opcional
}

// ── Feature 2 (Fase 1): Caderno de Erros ─────────────────────────────────

export interface ErrorEntry {
  id: string;
  blockLogId: string;
  subjectId: string;
  subjectTitle: string;
  subjectColor: string;
  subtopic: string;
  timestamp: number;
  questionsTotal: number;
  questionsCorrect: number;
  questionsWrong: number;
  note: string;
}

// ── Feature 1 (Fase 2): Revisão Espaçada ─────────────────────────────────
// Intervals in days: D+1, D+3, D+7, D+15, D+30, D+60

export const REVIEW_INTERVALS = [1, 3, 7, 15, 30, 60] as const;

export interface ReviewItem {
  id: string;
  subjectId: string;
  subjectTitle: string;
  subjectColor: string;
  subtopic: string;          // '(geral)' when empty
  createdAt: number;
  lastReviewedAt: number | null;
  nextReviewAt: number;      // midnight of due date (local TZ)
  intervalIndex: number;     // 0-5, index into REVIEW_INTERVALS
  consolidated: boolean;     // graduated after D+60
  reviewCount: number;
}

// ── Fase 6: Engajamento ───────────────────────────────────────────────────

export type AchievementId =
  | 'first-block'
  | 'first-week'
  | 'mil-questoes'
  | 'consistencia'
  | 'volta-por-cima'
  | 'maratonista'
  | 'detalhista';

export interface AchievementRecord {
  id: AchievementId;
  unlockedAt: number;
}

export interface StreakState {
  currentStreak: number;
  bonusBalance: number;    // dias bônus disponíveis (0-3)
  longestStreak: number;
  totalStudyDays: number;
  lastStudyDate: string | null;
  bonusUsedRecently: boolean; // bônus usado nas últimas 24h → mostra banner
}

// ── Fase 5: Específicos por público ──────────────────────────────────────

// Feature 1: Módulo Redação
export interface RedacaoCompetencyScores {
  c1: number; // 0-200: domínio da modalidade escrita
  c2: number; // 0-200: compreensão do tema
  c3: number; // 0-200: seleção de informações e argumentos
  c4: number; // 0-200: coesão textual
  c5: number; // 0-200: proposta de intervenção
}

export type RedacaoThemeAxis =
  | 'meio-ambiente' | 'tecnologia' | 'sociedade' | 'saude'
  | 'educacao' | 'direitos' | 'economia' | 'cultura' | 'treino';

export interface RedacaoTheme {
  id: string;
  title: string;
  year?: number;       // ENEM: ano da prova
  axis: RedacaoThemeAxis;
  source: 'enem' | 'treino';
  verified: boolean;   // false = precisa verificação em fonte oficial
}

export interface RedacaoSession {
  id: string;
  themeId: string;
  themeTitle: string;
  startedAt: number;
  lastSavedAt: number;
  completedAt: number | null;
  durationMinutes: number;        // tempo real de escrita
  text: string;
  wordCount: number;
  competencyScores: RedacaoCompetencyScores | null;
  estimatedScore: number | null;  // soma das competências (0-1000)
  notes: string;
}

// Feature 2: Filtro por banca
export const BANCAS = [
  'CESPE/CEBRASPE', 'FCC', 'FGV', 'VUNESP',
  'IBFC', 'Quadrix', 'IADES', 'Outra',
] as const;
export type Banca = typeof BANCAS[number];

// Feature 3: Configuração de notificações
export interface NotificationSettings {
  enabled: boolean;
  morningReview: boolean;     // revisões pendentes de manhã
  eveningStreak: boolean;     // streak no fim do dia
  weekendSimulado: boolean;   // sugestão de simulado na sexta
  examProximity: boolean;     // alertas de proximidade da prova
  streakRisk: boolean;        // risco de quebrar streak (opt-in)
}

// ── Fase 4: Modo Simulado ─────────────────────────────────────────────────

export interface SimuladoArea {
  name: string;
  color: string;
  questionCount?: number; // total de questões nesta área
}

export interface SimuladoTemplate {
  id: string;
  name: string;
  durationMinutes: number;
  strictMode: boolean; // sem pausas livres
  hasRedacao: boolean; // exibe campo de redação no pós-simulado
  areas: SimuladoArea[];
}

export interface SimuladoAreaResult {
  areaName: string;
  color: string;
  questionsTotal: number;
  questionsCorrect: number;
}

export interface SimuladoRecord {
  id: string;
  templateId: string;
  templateName: string;
  startedAt: number;
  completedAt: number;
  plannedDurationMinutes: number;
  actualDurationMinutes: number;
  completed: boolean; // false = interrompido
  areaResults: SimuladoAreaResult[];
  timeControlScore: 1|2|3|4|5 | null; // percepção de gestão do tempo
  perception: string; // campo livre
  redacaoText: string; // ENEM: texto da redação
  redacaoScore: number | null; // 0-1000, nota manual
}

// ── Fase 3: Edital e cronograma ───────────────────────────────────────────

export interface EditalSubtopic {
  name: string;
  /** Incidência histórica nas últimas 5 provas (0-100). 0 = não medido. */
  incidencia: number;
}

export interface EditalSubject {
  name: string;
  /** Peso relativo no edital (0-100). Soma dos subjects pode ser 100. */
  weight: number;
  color: string;
  subtopics: EditalSubtopic[];
}

export interface Edital {
  id: string;
  name: string;
  organizer: string;
  category: 'enem' | 'federal' | 'estadual' | 'municipal';
  typicalMonth: string;
  /** Aviso sobre precisão dos dados — obrigatório para editais não-ENEM. */
  disclaimer: string;
  subjects: EditalSubject[];
}

// ── Legacy / Objectives ───────────────────────────────────────────────────

export interface Completion {
  timestamp: number;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  frequency: Frequency;
  targetCount: number;
  duration: number;
  color: string;
  createdAt: number;
  completions: Completion[];
}

export interface UserStats {
  totalSprints: number;
  longestStreak: number;
  currentStreak: number;
}

// ── Subject ───────────────────────────────────────────────────────────────

export interface Subject {
  id: string;
  title: string;
  color: string;
  duration: number;   // minutes per block
  blockCount: number;
  completedBlocks: CompletedBlock[];  // was number[] — migrated in Dexie v3
}

// ── Sprint queue/runner ───────────────────────────────────────────────────

export type SprintQueueItem =
  | { id: string; type: 'study'; subjectId: string; blockType: BlockType }
  | { id: string; type: 'break'; duration: number }
  | { id: string; type: 'review-break'; duration: number; pendingSubtopics: string[] }

export type SprintResolvedItem =
  | { type: 'study'; subject: Subject; blockType: BlockType }
  | { type: 'break'; duration: number }
  | { type: 'review-break'; duration: number; pendingSubtopics: string[] }
