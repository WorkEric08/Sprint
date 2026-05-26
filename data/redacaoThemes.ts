/**
 * Banco de temas de redação para o Sprint.
 *
 * ⚠️ INSTRUÇÃO IMPORTANTE — CURADORIA MANUAL OBRIGATÓRIA
 * ─────────────────────────────────────────────────────────────────────────
 * Os temas ENEM (source: 'enem') DEVEM ser verificados manualmente em:
 *   → https://enem.inep.gov.br (edições anteriores)
 *   → https://download.inep.gov.br (redações oficiais)
 *
 * NÃO confie em AI para preencher anos e títulos de temas ENEM.
 * Erro aqui induz o estudante a praticar tema errado.
 *
 * Os temas de treino (source: 'treino') são seguros de usar como está.
 *
 * COMO ADICIONAR TEMAS ENEM:
 * 1. Acesse o portal INEP da edição desejada
 * 2. Baixe o PDF do caderno de questões do Dia 1
 * 3. Copie o título exato do tema (última página da prova)
 * 4. Preencha `year`, `title` e mude `verified: false` → `true`
 * ─────────────────────────────────────────────────────────────────────────
 */

import { RedacaoTheme } from '../types';

export const REDACAO_THEMES: RedacaoTheme[] = [

  // ── Temas ENEM — preencher manualmente via INEP ───────────────────────
  // verified: false = precisa confirmação na fonte oficial

  {
    id: 'enem-2024',
    title: '⚠️ TODO: Tema ENEM 2024 — verificar em inep.gov.br',
    year: 2024,
    axis: 'treino',
    source: 'enem',
    verified: false,
  },
  {
    id: 'enem-2023',
    title: '⚠️ TODO: Tema ENEM 2023 — verificar em inep.gov.br',
    year: 2023,
    axis: 'treino',
    source: 'enem',
    verified: false,
  },
  {
    id: 'enem-2022',
    title: '⚠️ TODO: Tema ENEM 2022 — verificar em inep.gov.br',
    year: 2022,
    axis: 'treino',
    source: 'enem',
    verified: false,
  },
  {
    id: 'enem-2021',
    title: '⚠️ TODO: Tema ENEM 2021 — verificar em inep.gov.br',
    year: 2021,
    axis: 'treino',
    source: 'enem',
    verified: false,
  },
  {
    id: 'enem-2020',
    title: '⚠️ TODO: Tema ENEM 2020 — verificar em inep.gov.br',
    year: 2020,
    axis: 'treino',
    source: 'enem',
    verified: false,
  },
  {
    id: 'enem-2019',
    title: '⚠️ TODO: Tema ENEM 2019 — verificar em inep.gov.br',
    year: 2019,
    axis: 'treino',
    source: 'enem',
    verified: false,
  },
  {
    id: 'enem-2018',
    title: '⚠️ TODO: Tema ENEM 2018 — verificar em inep.gov.br',
    year: 2018,
    axis: 'tecnologia',
    source: 'enem',
    verified: false,
  },
  {
    id: 'enem-2017',
    title: '⚠️ TODO: Tema ENEM 2017 — verificar em inep.gov.br',
    year: 2017,
    axis: 'educacao',
    source: 'enem',
    verified: false,
  },
  {
    id: 'enem-2016',
    title: '⚠️ TODO: Tema ENEM 2016 — verificar em inep.gov.br',
    year: 2016,
    axis: 'direitos',
    source: 'enem',
    verified: false,
  },
  {
    id: 'enem-2015',
    title: '⚠️ TODO: Tema ENEM 2015 — verificar em inep.gov.br',
    year: 2015,
    axis: 'direitos',
    source: 'enem',
    verified: false,
  },

  // ── Temas Treino — por eixo temático ─────────────────────────────────
  // Estes são temas de prática, não ligados a edições específicas do ENEM.

  // Meio Ambiente
  {
    id: 'treino-ma-1',
    title: 'Desafios para a preservação da Amazônia no século XXI',
    axis: 'meio-ambiente',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-ma-2',
    title: 'O papel da educação ambiental na formação de cidadãos conscientes',
    axis: 'meio-ambiente',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-ma-3',
    title: 'Desafios para o enfrentamento da crise hídrica no Brasil',
    axis: 'meio-ambiente',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-ma-4',
    title: 'A responsabilidade das empresas na redução do impacto ambiental',
    axis: 'meio-ambiente',
    source: 'treino',
    verified: true,
  },

  // Tecnologia
  {
    id: 'treino-tec-1',
    title: 'O impacto das redes sociais na democracia brasileira',
    axis: 'tecnologia',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-tec-2',
    title: 'Inteligência artificial e o futuro do trabalho no Brasil',
    axis: 'tecnologia',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-tec-3',
    title: 'Fake news e o desafio da desinformação na era digital',
    axis: 'tecnologia',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-tec-4',
    title: 'A dependência tecnológica e seus efeitos na saúde mental',
    axis: 'tecnologia',
    source: 'treino',
    verified: true,
  },

  // Sociedade
  {
    id: 'treino-soc-1',
    title: 'O papel da família na formação de valores éticos dos jovens',
    axis: 'sociedade',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-soc-2',
    title: 'Desafios para a erradicação do trabalho infantil no Brasil',
    axis: 'sociedade',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-soc-3',
    title: 'O envelhecimento da população brasileira e os desafios para a previdência',
    axis: 'sociedade',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-soc-4',
    title: 'Desafios para a integração de refugiados na sociedade brasileira',
    axis: 'sociedade',
    source: 'treino',
    verified: true,
  },

  // Saúde
  {
    id: 'treino-sau-1',
    title: 'Desafios para o fortalecimento do Sistema Único de Saúde no Brasil',
    axis: 'saude',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-sau-2',
    title: 'O impacto da pandemia na saúde mental dos brasileiros',
    axis: 'saude',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-sau-3',
    title: 'Desafios para o enfrentamento das doenças negligenciadas no Brasil',
    axis: 'saude',
    source: 'treino',
    verified: true,
  },

  // Educação
  {
    id: 'treino-edu-1',
    title: 'Desafios para a superação do analfabetismo funcional no Brasil',
    axis: 'educacao',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-edu-2',
    title: 'O papel do ensino técnico na redução das desigualdades sociais',
    axis: 'educacao',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-edu-3',
    title: 'Desafios para a inclusão de pessoas com deficiência nas escolas brasileiras',
    axis: 'educacao',
    source: 'treino',
    verified: true,
  },

  // Direitos
  {
    id: 'treino-dir-1',
    title: 'O avanço do racismo estrutural e os desafios para sua superação',
    axis: 'direitos',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-dir-2',
    title: 'Desafios para a garantia dos direitos da pessoa com deficiência no Brasil',
    axis: 'direitos',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-dir-3',
    title: 'A violência doméstica e os desafios para a proteção da mulher',
    axis: 'direitos',
    source: 'treino',
    verified: true,
  },

  // Economia
  {
    id: 'treino-eco-1',
    title: 'Desafios para o empreendedorismo jovem no Brasil',
    axis: 'economia',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-eco-2',
    title: 'O impacto da informalidade no mercado de trabalho brasileiro',
    axis: 'economia',
    source: 'treino',
    verified: true,
  },

  // Cultura
  {
    id: 'treino-cul-1',
    title: 'O papel do patrimônio histórico na construção da identidade nacional',
    axis: 'cultura',
    source: 'treino',
    verified: true,
  },
  {
    id: 'treino-cul-2',
    title: 'Desafios para a valorização das culturas indígenas no Brasil',
    axis: 'cultura',
    source: 'treino',
    verified: true,
  },
];

export const AXIS_LABELS: Record<string, string> = {
  'meio-ambiente': 'Meio Ambiente',
  'tecnologia':    'Tecnologia',
  'sociedade':     'Sociedade',
  'saude':         'Saúde',
  'educacao':      'Educação',
  'direitos':      'Direitos',
  'economia':      'Economia',
  'cultura':       'Cultura',
  'treino':        'Treino Geral',
};

export const AXIS_COLORS: Record<string, string> = {
  'meio-ambiente': '#10b981',
  'tecnologia':    '#6366f1',
  'sociedade':     '#f59e0b',
  'saude':         '#ef4444',
  'educacao':      '#3b82f6',
  'direitos':      '#8b5cf6',
  'economia':      '#06b6d4',
  'cultura':       '#f97316',
  'treino':        '#6b7280',
};
