/**
 * Banco de editais do Sprint.
 *
 * FONTES E CONFIABILIDADE:
 * ─────────────────────────────────────────────────────────────────────────
 * • ENEM: Matriz de Referência oficial do INEP (estável desde 2009).
 *   Competências e habilidades extraídas do documento público do INEP.
 *
 * • Demais concursos: estrutura baseada em editais anteriores típicos.
 *   ⚠️  CAMPOS INCOMPLETOS — verificar edital vigente antes de usar:
 *   - `weight` (peso por matéria): placeholder proporcional, precisa de ajuste
 *   - `incidencia` (% nas últimas 5 provas): 0 = não preenchido, pesquisa manual necessária
 *   - `subtopics`: lista base, pode diferir do edital atual
 *
 * COMO ATUALIZAR:
 * 1. Acesse o edital oficial da banca (Cebraspe, FCC, FGV, VUNESP, etc.)
 * 2. Ajuste `weight` (soma deve ser 100 por edital)
 * 3. Preencha `incidencia` analisando as últimas 5 provas gabaritadas
 * 4. Atualize `subtopics` conforme o conteúdo programático oficial
 * 5. Altere o `disclaimer` para refletir a versão verificada
 * ─────────────────────────────────────────────────────────────────────────
 */

import { Edital } from '../types';

export const EDITAIS: Edital[] = [

  // ── ENEM ──────────────────────────────────────────────────────────────
  // Fonte: Matriz de Referência do ENEM — INEP/MEC (doc. público)
  // Última verificação: Matriz vigente desde 2009, revisada em 2012
  {
    id: 'enem',
    name: 'ENEM',
    organizer: 'INEP',
    category: 'enem',
    typicalMonth: 'Novembro',
    disclaimer: 'Baseado na Matriz de Referência oficial do INEP. Verifique a edição atual em enem.inep.gov.br.',
    subjects: [
      {
        name: 'Linguagens e Códigos',
        weight: 22,
        color: '#8b5cf6',
        subtopics: [
          { name: 'Interpretação de Texto', incidencia: 0 },
          { name: 'Gramática e Língua Portuguesa', incidencia: 0 },
          { name: 'Literatura Brasileira', incidencia: 0 },
          { name: 'Variação Linguística', incidencia: 0 },
          { name: 'Tipologia e Gêneros Textuais', incidencia: 0 },
          { name: 'Intertextualidade', incidencia: 0 },
          { name: 'Figuras de Linguagem', incidencia: 0 },
          { name: 'Arte e Cultura', incidencia: 0 },
          { name: 'Tecnologias da Informação e Comunicação', incidencia: 0 },
          { name: 'Educação Física e Linguagem Corporal', incidencia: 0 },
        ],
      },
      {
        name: 'Língua Estrangeira',
        weight: 3,
        color: '#a78bfa',
        subtopics: [
          { name: 'Interpretação de Texto em Inglês', incidencia: 0 },
          { name: 'Vocabulário e Expressões', incidencia: 0 },
          { name: 'Interpretação de Texto em Espanhol', incidencia: 0 },
        ],
      },
      {
        name: 'Ciências Humanas',
        weight: 22,
        color: '#f59e0b',
        subtopics: [
          { name: 'História do Brasil', incidencia: 0 },
          { name: 'História Geral', incidencia: 0 },
          { name: 'Geografia do Brasil', incidencia: 0 },
          { name: 'Geografia Mundial', incidencia: 0 },
          { name: 'Filosofia — Ética e Cidadania', incidencia: 0 },
          { name: 'Filosofia — Epistemologia', incidencia: 0 },
          { name: 'Sociologia — Estrutura Social', incidencia: 0 },
          { name: 'Sociologia — Movimentos Sociais', incidencia: 0 },
          { name: 'Atualidades e Geopolítica', incidencia: 0 },
        ],
      },
      {
        name: 'Ciências da Natureza',
        weight: 22,
        color: '#10b981',
        subtopics: [
          { name: 'Física — Mecânica', incidencia: 0 },
          { name: 'Física — Termodinâmica', incidencia: 0 },
          { name: 'Física — Eletromagnetismo', incidencia: 0 },
          { name: 'Física — Óptica e Ondas', incidencia: 0 },
          { name: 'Química — Geral e Inorgânica', incidencia: 0 },
          { name: 'Química — Orgânica', incidencia: 0 },
          { name: 'Química — Físico-Química', incidencia: 0 },
          { name: 'Biologia — Citologia e Histologia', incidencia: 0 },
          { name: 'Biologia — Genética e Evolução', incidencia: 0 },
          { name: 'Biologia — Ecologia', incidencia: 0 },
          { name: 'Biologia — Fisiologia e Anatomia', incidencia: 0 },
        ],
      },
      {
        name: 'Matemática',
        weight: 22,
        color: '#3b82f6',
        subtopics: [
          { name: 'Álgebra e Equações', incidencia: 0 },
          { name: 'Funções', incidencia: 0 },
          { name: 'Funções Quadráticas', incidencia: 0 },
          { name: 'Geometria Plana', incidencia: 0 },
          { name: 'Geometria Espacial', incidencia: 0 },
          { name: 'Trigonometria', incidencia: 0 },
          { name: 'Progressões Aritméticas e Geométricas', incidencia: 0 },
          { name: 'Probabilidade', incidencia: 0 },
          { name: 'Estatística', incidencia: 0 },
          { name: 'Combinatória', incidencia: 0 },
          { name: 'Matemática Financeira', incidencia: 0 },
          { name: 'Matrizes e Sistemas Lineares', incidencia: 0 },
        ],
      },
      {
        name: 'Redação',
        weight: 9,
        color: '#ef4444',
        subtopics: [
          { name: 'Texto Dissertativo-Argumentativo', incidencia: 0 },
          { name: 'Proposta de Intervenção', incidencia: 0 },
          { name: 'Competência 1 — Domínio da Língua', incidencia: 0 },
          { name: 'Competência 2 — Compreensão do Tema', incidencia: 0 },
          { name: 'Competência 3 — Seleção de Argumentos', incidencia: 0 },
          { name: 'Competência 4 — Coesão e Coerência', incidencia: 0 },
          { name: 'Competência 5 — Proposta de Intervenção', incidencia: 0 },
        ],
      },
    ],
  },

  // ── PRF — Policial Rodoviário Federal ─────────────────────────────────
  // ⚠️  Estrutura baseada em editais anteriores (Cebraspe). Verificar edital vigente.
  // incidencia: 0 em todos os campos — preencher com pesquisa nas últimas 5 provas.
  {
    id: 'prf-policial',
    name: 'PRF — Policial Rodoviário Federal',
    organizer: 'Cebraspe',
    category: 'federal',
    typicalMonth: 'Variável',
    disclaimer: '⚠️ Baseado em editais anteriores da PRF/Cebraspe. Incidências não preenchidas. Verifique o edital vigente em prf.gov.br.',
    subjects: [
      {
        name: 'Língua Portuguesa',
        weight: 15,
        color: '#8b5cf6',
        subtopics: [
          { name: 'Interpretação de Texto', incidencia: 0 },
          { name: 'Gramática — Morfologia', incidencia: 0 },
          { name: 'Gramática — Sintaxe', incidencia: 0 },
          { name: 'Semântica e Estilística', incidencia: 0 },
          { name: 'Ortografia e Acentuação', incidencia: 0 },
        ],
      },
      {
        name: 'Raciocínio Lógico-Matemático',
        weight: 15,
        color: '#3b82f6',
        subtopics: [
          { name: 'Lógica Proposicional', incidencia: 0 },
          { name: 'Conjuntos e Operações', incidencia: 0 },
          { name: 'Probabilidade e Estatística', incidencia: 0 },
          { name: 'Sequências e Progressões', incidencia: 0 },
          { name: 'Geometria e Proporcionalidade', incidencia: 0 },
          { name: 'Raciocínio Analítico', incidencia: 0 },
        ],
      },
      {
        name: 'Informática',
        weight: 10,
        color: '#06b6d4',
        subtopics: [
          { name: 'Sistemas Operacionais (Windows/Linux)', incidencia: 0 },
          { name: 'Pacote Office / LibreOffice', incidencia: 0 },
          { name: 'Internet e Segurança da Informação', incidencia: 0 },
          { name: 'Redes de Computadores', incidencia: 0 },
        ],
      },
      {
        name: 'Legislação de Trânsito (CTB)',
        weight: 20,
        color: '#f97316',
        subtopics: [
          { name: 'Código de Trânsito Brasileiro', incidencia: 0 },
          { name: 'Infrações e Penalidades', incidencia: 0 },
          { name: 'CNH — Habilitação', incidencia: 0 },
          { name: 'Sinalização de Trânsito', incidencia: 0 },
          { name: 'Legislação Específica PRF', incidencia: 0 },
        ],
      },
      {
        name: 'Direito Constitucional',
        weight: 15,
        color: '#6366f1',
        subtopics: [
          { name: 'Princípios Fundamentais', incidencia: 0 },
          { name: 'Direitos e Garantias Fundamentais', incidencia: 0 },
          { name: 'Organização do Estado', incidencia: 0 },
          { name: 'Poder Judiciário e MP', incidencia: 0 },
        ],
      },
      {
        name: 'Direito Administrativo',
        weight: 15,
        color: '#8b5cf6',
        subtopics: [
          { name: 'Princípios da Administração Pública', incidencia: 0 },
          { name: 'Atos Administrativos', incidencia: 0 },
          { name: 'Licitações e Contratos (Lei 14.133/21)', incidencia: 0 },
          { name: 'Servidores Públicos', incidencia: 0 },
          { name: 'Improbidade Administrativa', incidencia: 0 },
        ],
      },
      {
        name: 'Língua Inglesa',
        weight: 10,
        color: '#14b8a6',
        subtopics: [
          { name: 'Interpretação de Texto', incidencia: 0 },
          { name: 'Vocabulário e Gramática', incidencia: 0 },
        ],
      },
    ],
  },

  // ── PF — Agente de Polícia Federal ───────────────────────────────────
  // ⚠️  Estrutura baseada em editais anteriores (Cebraspe). Verificar edital vigente.
  {
    id: 'pf-agente',
    name: 'PF — Agente de Polícia Federal',
    organizer: 'Cebraspe',
    category: 'federal',
    typicalMonth: 'Variável',
    disclaimer: '⚠️ Baseado em editais anteriores da PF/Cebraspe. Incidências não preenchidas. Verifique o edital vigente em pf.gov.br.',
    subjects: [
      { name: 'Língua Portuguesa', weight: 10, color: '#8b5cf6', subtopics: [
        { name: 'Interpretação de Texto', incidencia: 0 },
        { name: 'Gramática', incidencia: 0 },
        { name: 'Redação Oficial', incidencia: 0 },
      ]},
      { name: 'Língua Inglesa', weight: 10, color: '#14b8a6', subtopics: [
        { name: 'Interpretação de Texto', incidencia: 0 },
        { name: 'Gramática e Vocabulário', incidencia: 0 },
      ]},
      { name: 'Raciocínio Lógico', weight: 10, color: '#3b82f6', subtopics: [
        { name: 'Lógica Proposicional', incidencia: 0 },
        { name: 'Raciocínio Analítico', incidencia: 0 },
        { name: 'Matemática Básica', incidencia: 0 },
      ]},
      { name: 'Informática', weight: 10, color: '#06b6d4', subtopics: [
        { name: 'Sistemas Operacionais', incidencia: 0 },
        { name: 'Segurança da Informação', incidencia: 0 },
        { name: 'Redes', incidencia: 0 },
      ]},
      { name: 'Direito Constitucional', weight: 15, color: '#6366f1', subtopics: [
        { name: 'Princípios Fundamentais', incidencia: 0 },
        { name: 'Direitos Fundamentais', incidencia: 0 },
        { name: 'Organização do Estado e Poderes', incidencia: 0 },
      ]},
      { name: 'Direito Administrativo', weight: 15, color: '#7c3aed', subtopics: [
        { name: 'Atos e Poderes Administrativos', incidencia: 0 },
        { name: 'Licitações (Lei 14.133/21)', incidencia: 0 },
        { name: 'Servidores e Regime Jurídico', incidencia: 0 },
      ]},
      { name: 'Direito Penal', weight: 15, color: '#ef4444', subtopics: [
        { name: 'Teoria Geral do Crime', incidencia: 0 },
        { name: 'Crimes contra a Pessoa', incidencia: 0 },
        { name: 'Crimes contra o Patrimônio', incidencia: 0 },
        { name: 'Legislação Especial PF', incidencia: 0 },
      ]},
      { name: 'Direito Processual Penal', weight: 10, color: '#f97316', subtopics: [
        { name: 'Inquérito Policial', incidencia: 0 },
        { name: 'Ação Penal', incidencia: 0 },
        { name: 'Provas', incidencia: 0 },
        { name: 'Prisão e Medidas Cautelares', incidencia: 0 },
      ]},
      { name: 'Atualidades', weight: 5, color: '#10b981', subtopics: [
        { name: 'Geopolítica Mundial', incidencia: 0 },
        { name: 'Brasil — Economia e Política', incidencia: 0 },
      ]},
    ],
  },

  // ── INSS — Técnico do Seguro Social ──────────────────────────────────
  // ⚠️  Estrutura baseada em editais anteriores. Verificar banca e edital vigente.
  {
    id: 'inss-tecnico',
    name: 'INSS — Técnico do Seguro Social',
    organizer: 'Cebraspe / FCC',
    category: 'federal',
    typicalMonth: 'Variável',
    disclaimer: '⚠️ Baseado em editais anteriores do INSS. Banca pode variar. Incidências não preenchidas. Verifique em inss.gov.br.',
    subjects: [
      { name: 'Língua Portuguesa', weight: 20, color: '#8b5cf6', subtopics: [
        { name: 'Interpretação de Texto', incidencia: 0 },
        { name: 'Gramática', incidencia: 0 },
        { name: 'Redação Oficial', incidencia: 0 },
      ]},
      { name: 'Raciocínio Lógico-Matemático', weight: 15, color: '#3b82f6', subtopics: [
        { name: 'Lógica', incidencia: 0 },
        { name: 'Matemática Básica', incidencia: 0 },
        { name: 'Raciocínio Quantitativo', incidencia: 0 },
      ]},
      { name: 'Informática', weight: 10, color: '#06b6d4', subtopics: [
        { name: 'Pacote Office', incidencia: 0 },
        { name: 'Internet e Segurança', incidencia: 0 },
      ]},
      { name: 'Legislação Previdenciária', weight: 35, color: '#10b981', subtopics: [
        { name: 'Seguridade Social — Conceitos e Princípios', incidencia: 0 },
        { name: 'RGPS — Segurados e Dependentes', incidencia: 0 },
        { name: 'Benefícios Previdenciários', incidencia: 0 },
        { name: 'Custeio do RGPS', incidencia: 0 },
        { name: 'Acidente do Trabalho', incidencia: 0 },
        { name: 'Processo Administrativo Previdenciário', incidencia: 0 },
      ]},
      { name: 'Direito Administrativo', weight: 10, color: '#6366f1', subtopics: [
        { name: 'Princípios e Atos Administrativos', incidencia: 0 },
        { name: 'Lei 8.112/90', incidencia: 0 },
      ]},
      { name: 'Direito Constitucional', weight: 10, color: '#7c3aed', subtopics: [
        { name: 'Direitos Fundamentais', incidencia: 0 },
        { name: 'Organização do Estado', incidencia: 0 },
      ]},
    ],
  },

  // ── TJ-SP — Escrevente Técnico Judiciário ────────────────────────────
  // ⚠️  Banca: VUNESP. Verificar edital vigente em tjsp.jus.br.
  {
    id: 'tjsp-escrevente',
    name: 'TJ-SP — Escrevente Técnico Judiciário',
    organizer: 'VUNESP',
    category: 'estadual',
    typicalMonth: 'Variável',
    disclaimer: '⚠️ Baseado em editais anteriores do TJ-SP/VUNESP. Incidências não preenchidas. Verifique o edital vigente.',
    subjects: [
      { name: 'Língua Portuguesa', weight: 20, color: '#8b5cf6', subtopics: [
        { name: 'Interpretação de Texto', incidencia: 0 },
        { name: 'Gramática', incidencia: 0 },
        { name: 'Vocabulário e Ortografia', incidencia: 0 },
      ]},
      { name: 'Informática', weight: 15, color: '#06b6d4', subtopics: [
        { name: 'Windows e Office', incidencia: 0 },
        { name: 'Internet e E-mail', incidencia: 0 },
        { name: 'Segurança Digital', incidencia: 0 },
      ]},
      { name: 'Direito Constitucional', weight: 15, color: '#6366f1', subtopics: [
        { name: 'Direitos Fundamentais', incidencia: 0 },
        { name: 'Organização do Estado', incidencia: 0 },
      ]},
      { name: 'Direito Administrativo', weight: 15, color: '#7c3aed', subtopics: [
        { name: 'Atos Administrativos', incidencia: 0 },
        { name: 'Licitações', incidencia: 0 },
        { name: 'Servidores Públicos', incidencia: 0 },
      ]},
      { name: 'Direito Civil', weight: 15, color: '#ef4444', subtopics: [
        { name: 'Pessoa Natural e Jurídica', incidencia: 0 },
        { name: 'Negócios Jurídicos', incidencia: 0 },
        { name: 'Obrigações e Contratos', incidencia: 0 },
      ]},
      { name: 'Direito Processual Civil', weight: 10, color: '#f97316', subtopics: [
        { name: 'Partes e Procuradores', incidencia: 0 },
        { name: 'Atos Processuais', incidencia: 0 },
        { name: 'Processo de Conhecimento', incidencia: 0 },
      ]},
      { name: 'Legislação Estadual SP', weight: 10, color: '#10b981', subtopics: [
        { name: 'Organização Judiciária SP', incidencia: 0 },
        { name: 'Estatuto dos Funcionários Públicos SP', incidencia: 0 },
      ]},
    ],
  },

  // ── TJ-RJ ─────────────────────────────────────────────────────────────
  // ⚠️  Banca geralmente FGV. Verificar edital vigente em tjrj.jus.br.
  {
    id: 'tjrj-tecnico',
    name: 'TJ-RJ — Técnico Judiciário',
    organizer: 'FGV',
    category: 'estadual',
    typicalMonth: 'Variável',
    disclaimer: '⚠️ Baseado em editais anteriores do TJ-RJ/FGV. Incidências não preenchidas. Verifique o edital vigente.',
    subjects: [
      { name: 'Língua Portuguesa', weight: 20, color: '#8b5cf6', subtopics: [
        { name: 'Compreensão e Interpretação de Texto', incidencia: 0 },
        { name: 'Gramática Normativa', incidencia: 0 },
      ]},
      { name: 'Raciocínio Lógico', weight: 15, color: '#3b82f6', subtopics: [
        { name: 'Lógica Formal', incidencia: 0 },
        { name: 'Matemática Básica', incidencia: 0 },
      ]},
      { name: 'Informática', weight: 15, color: '#06b6d4', subtopics: [
        { name: 'Aplicativos Office', incidencia: 0 },
        { name: 'Segurança da Informação', incidencia: 0 },
      ]},
      { name: 'Direito Constitucional', weight: 15, color: '#6366f1', subtopics: [
        { name: 'Direitos e Garantias', incidencia: 0 },
        { name: 'Organização dos Poderes', incidencia: 0 },
      ]},
      { name: 'Direito Administrativo', weight: 15, color: '#7c3aed', subtopics: [
        { name: 'Princípios da Adm. Pública', incidencia: 0 },
        { name: 'Atos Administrativos', incidencia: 0 },
        { name: 'Lei 8.112/90 (aplicada ao RJ)', incidencia: 0 },
      ]},
      { name: 'Direito Processual Civil', weight: 10, color: '#f97316', subtopics: [
        { name: 'Competência e Jurisdição', incidencia: 0 },
        { name: 'Processo de Conhecimento', incidencia: 0 },
      ]},
      { name: 'Atualidades', weight: 10, color: '#10b981', subtopics: [
        { name: 'Fatos Recentes Nacionais', incidencia: 0 },
        { name: 'Cidadania e Ética', incidencia: 0 },
      ]},
    ],
  },

  // ── TJ-MG ─────────────────────────────────────────────────────────────
  // ⚠️  Banca geralmente FUMARC/IBFC. Verificar edital vigente em tjmg.jus.br.
  {
    id: 'tjmg-tecnico',
    name: 'TJ-MG — Técnico Judiciário',
    organizer: 'FUMARC / IBFC',
    category: 'estadual',
    typicalMonth: 'Variável',
    disclaimer: '⚠️ Baseado em editais anteriores do TJ-MG. Incidências não preenchidas. Verifique o edital vigente.',
    subjects: [
      { name: 'Língua Portuguesa', weight: 25, color: '#8b5cf6', subtopics: [
        { name: 'Interpretação e Produção Textual', incidencia: 0 },
        { name: 'Gramática', incidencia: 0 },
      ]},
      { name: 'Conhecimentos Gerais', weight: 10, color: '#10b981', subtopics: [
        { name: 'Atualidades', incidencia: 0 },
        { name: 'Noções de Cidadania', incidencia: 0 },
      ]},
      { name: 'Informática', weight: 15, color: '#06b6d4', subtopics: [
        { name: 'Pacote Office', incidencia: 0 },
        { name: 'Sistemas e Redes', incidencia: 0 },
      ]},
      { name: 'Direito Constitucional', weight: 15, color: '#6366f1', subtopics: [
        { name: 'Princípios e Direitos Fundamentais', incidencia: 0 },
        { name: 'Organização dos Poderes', incidencia: 0 },
      ]},
      { name: 'Direito Administrativo', weight: 15, color: '#7c3aed', subtopics: [
        { name: 'Atos Administrativos', incidencia: 0 },
        { name: 'Servidores Públicos', incidencia: 0 },
      ]},
      { name: 'Noções de Direito Civil e Processual', weight: 20, color: '#f97316', subtopics: [
        { name: 'Direito Civil Básico', incidencia: 0 },
        { name: 'Processo Civil', incidencia: 0 },
        { name: 'Organização Judiciária MG', incidencia: 0 },
      ]},
    ],
  },

  // ── Municipal — Modelo Genérico ───────────────────────────────────────
  // ⚠️  Estrutura genérica para concursos municipais. Adaptar ao edital específico.
  {
    id: 'municipal-generico',
    name: 'Municipal — Modelo Genérico',
    organizer: 'Variável',
    category: 'municipal',
    typicalMonth: 'Variável',
    disclaimer: '⚠️ Modelo genérico para concursos municipais. Adapte as matérias e pesos ao edital específico do município.',
    subjects: [
      { name: 'Língua Portuguesa', weight: 30, color: '#8b5cf6', subtopics: [
        { name: 'Interpretação de Texto', incidencia: 0 },
        { name: 'Gramática', incidencia: 0 },
        { name: 'Ortografia e Pontuação', incidencia: 0 },
      ]},
      { name: 'Raciocínio Lógico e Matemática', weight: 20, color: '#3b82f6', subtopics: [
        { name: 'Operações Básicas', incidencia: 0 },
        { name: 'Lógica', incidencia: 0 },
        { name: 'Proporcionalidade e Regra de Três', incidencia: 0 },
      ]},
      { name: 'Informática', weight: 15, color: '#06b6d4', subtopics: [
        { name: 'Office e Internet', incidencia: 0 },
        { name: 'Segurança Digital', incidencia: 0 },
      ]},
      { name: 'Conhecimentos Gerais e Atualidades', weight: 15, color: '#10b981', subtopics: [
        { name: 'Atualidades Nacionais', incidencia: 0 },
        { name: 'Noções de Cidadania', incidencia: 0 },
      ]},
      { name: 'Legislação Municipal', weight: 20, color: '#f97316', subtopics: [
        { name: 'Lei Orgânica Municipal', incidencia: 0 },
        { name: 'Estatuto dos Servidores Municipais', incidencia: 0 },
        { name: 'Regime Previdenciário Municipal', incidencia: 0 },
      ]},
    ],
  },
];

export const EDITAL_CATEGORIES = {
  enem:      { label: 'ENEM',         icon: 'fa-graduation-cap' },
  federal:   { label: 'Federal',      icon: 'fa-landmark'       },
  estadual:  { label: 'Estadual',     icon: 'fa-building-columns' },
  municipal: { label: 'Municipal',    icon: 'fa-city'           },
} as const;
