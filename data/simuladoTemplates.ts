import { SimuladoTemplate } from '../types';

export const SIMULADO_TEMPLATES: SimuladoTemplate[] = [
  {
    id: 'enem-dia1',
    name: 'ENEM — Dia 1',
    durationMinutes: 330, // 5h30min
    strictMode: true,
    hasRedacao: true,
    areas: [
      { name: 'Linguagens e Códigos', color: '#8b5cf6', questionCount: 40 },
      { name: 'Língua Estrangeira',   color: '#a78bfa', questionCount:  5 },
      { name: 'Ciências Humanas',     color: '#f59e0b', questionCount: 45 },
      { name: 'Redação',              color: '#ef4444', questionCount:  1 },
    ],
  },
  {
    id: 'enem-dia2',
    name: 'ENEM — Dia 2',
    durationMinutes: 300, // 5h
    strictMode: true,
    hasRedacao: false,
    areas: [
      { name: 'Ciências da Natureza', color: '#10b981', questionCount: 45 },
      { name: 'Matemática',           color: '#3b82f6', questionCount: 45 },
    ],
  },
  {
    id: 'prf-pf',
    name: 'PRF / PF',
    durationMinutes: 300, // 5h
    strictMode: false,
    hasRedacao: false,
    areas: [
      { name: 'Língua Portuguesa',         color: '#8b5cf6' },
      { name: 'Raciocínio Lógico',         color: '#3b82f6' },
      { name: 'Informática',               color: '#06b6d4' },
      { name: 'Legislação',                color: '#f97316' },
      { name: 'Direito Constitucional',    color: '#6366f1' },
      { name: 'Direito Administrativo',    color: '#7c3aed' },
    ],
  },
  {
    id: 'inss',
    name: 'INSS Técnico',
    durationMinutes: 240, // 4h
    strictMode: false,
    hasRedacao: false,
    areas: [
      { name: 'Língua Portuguesa',        color: '#8b5cf6' },
      { name: 'Raciocínio Lógico',        color: '#3b82f6' },
      { name: 'Legislação Previdenciária',color: '#10b981' },
      { name: 'Direito Administrativo',   color: '#6366f1' },
      { name: 'Informática',              color: '#06b6d4' },
    ],
  },
  {
    id: 'custom',
    name: 'Customizado',
    durationMinutes: 180, // padrão: 3h (ajustável)
    strictMode: false,
    hasRedacao: false,
    areas: [],
  },
];
