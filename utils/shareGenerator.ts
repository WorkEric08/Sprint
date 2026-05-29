/**
 * Geração de imagens compartilháveis via Canvas API.
 *
 * Sem dependências externas — usa Canvas 2D nativo.
 * Formatos: Feed (1080×1080) e Stories (1080×1920).
 *
 * PRINCÍPIO: Share é SEMPRE opt-in. Nunca chamar essas funções
 * automaticamente nem exibir modal pedindo para compartilhar.
 */

// Brand colors
const BRAND = {
  bg:        '#030712',
  bgCard:    '#111827',
  indigo:    '#6366f1',
  indigoL:   '#818cf8',
  gray:      '#6b7280',
  grayL:     '#d1d5db',
  white:     '#f9fafb',
  amber:     '#f59e0b',
  green:     '#22c55e',
  red:       '#ef4444',
};

function setupCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.fillStyle = BRAND.indigo;
  roundRect(ctx, x, y, size, size, size * 0.25);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${size * 0.5}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', x + size / 2, y + size / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** "Semana no Sprint" — Feed 1:1 */
export async function generateWeeklySummary(data: {
  userName: string;
  blocos: number;
  minutos: number;
  questoes: number;
  acertos: number;
  streakDays: number;
  weekLabel: string; // "semana de 20 a 26 de jan"
}): Promise<Blob> {
  const [canvas, ctx] = setupCanvas(1080, 1080);

  // Background
  ctx.fillStyle = BRAND.bg;
  ctx.fillRect(0, 0, 1080, 1080);

  // Subtle gradient overlay
  const grad = ctx.createRadialGradient(540, 200, 0, 540, 200, 700);
  grad.addColorStop(0, 'rgba(99,102,241,0.15)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Logo + name
  drawLogo(ctx, 80, 80, 64);
  ctx.fillStyle = BRAND.white;
  ctx.font = 'bold 40px system-ui';
  ctx.fillText('Sprint', 160, 128);

  // Title
  ctx.fillStyle = BRAND.grayL;
  ctx.font = '36px system-ui';
  ctx.fillText('Minha semana', 80, 260);
  ctx.fillStyle = BRAND.white;
  ctx.font = 'bold 56px system-ui';
  ctx.fillText(data.userName || 'Estudante', 80, 340);

  // Week label
  ctx.fillStyle = BRAND.gray;
  ctx.font = '32px system-ui';
  ctx.fillText(data.weekLabel, 80, 400);

  // Stats grid (2x2)
  const stats = [
    { label: 'Blocos', value: String(data.blocos), color: BRAND.indigo },
    { label: 'Minutos', value: String(data.minutos), color: BRAND.indigoL },
    { label: 'Questões', value: String(data.questoes), color: BRAND.amber },
    { label: 'Acerto', value: data.questoes > 0 ? `${Math.round((data.acertos / data.questoes) * 100)}%` : '—', color: BRAND.green },
  ];

  const cardW = 460;
  const cardH = 200;
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 80 + col * (cardW + 40);
    const y = 460 + row * (cardH + 32);

    ctx.fillStyle = BRAND.bgCard;
    roundRect(ctx, x, y, cardW, cardH, 24);
    ctx.fill();

    ctx.fillStyle = s.color;
    ctx.font = 'bold 80px system-ui';
    ctx.fillText(s.value, x + 32, y + 120);

    ctx.fillStyle = BRAND.gray;
    ctx.font = '32px system-ui';
    ctx.fillText(s.label.toUpperCase(), x + 32, y + 168);
  });

  // Streak
  if (data.streakDays > 0) {
    ctx.fillStyle = BRAND.amber;
    ctx.font = 'bold 36px system-ui';
    ctx.fillText(`🔥 ${data.streakDays} dias seguidos`, 80, 980);
  }

  return canvasToBlob(canvas);
}

/** "Meu Ano no Sprint" — Stories 9:16 com heatmap */
export async function generateYearWrap(data: {
  userName: string;
  totalBlocks: number;
  totalStudyDays: number;
  streakRecord: number;
  topSubject: string | null;
  activeDayKeys: Set<string>;
}): Promise<Blob> {
  const [canvas, ctx] = setupCanvas(1080, 1920);

  // Background
  ctx.fillStyle = BRAND.bg;
  ctx.fillRect(0, 0, 1080, 1920);

  const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
  grad.addColorStop(0, 'rgba(99,102,241,0.2)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Logo
  drawLogo(ctx, 80, 100, 80);
  ctx.fillStyle = BRAND.white;
  ctx.font = 'bold 48px system-ui';
  ctx.fillText('Sprint', 184, 156);

  // Title
  ctx.fillStyle = BRAND.indigoL;
  ctx.font = 'bold 52px system-ui';
  ctx.fillText('Meu Ano', 80, 360);
  ctx.fillStyle = BRAND.white;
  ctx.font = 'bold 88px system-ui';
  ctx.fillText(data.userName || 'Estudante', 80, 480);

  // Big number
  ctx.fillStyle = BRAND.indigo;
  ctx.font = `bold 200px system-ui`;
  ctx.fillText(String(data.totalBlocks), 80, 780);
  ctx.fillStyle = BRAND.grayL;
  ctx.font = '48px system-ui';
  ctx.fillText('blocos de estudo', 80, 840);

  // Stats row
  const statsY = 980;
  const miniStats = [
    { label: 'Dias de estudo', value: data.totalStudyDays },
    { label: 'Recorde streak', value: data.streakRecord },
  ];
  miniStats.forEach((s, i) => {
    const x = 80 + i * 480;
    ctx.fillStyle = BRAND.white;
    ctx.font = 'bold 96px system-ui';
    ctx.fillText(String(s.value), x, statsY + 80);
    ctx.fillStyle = BRAND.gray;
    ctx.font = '36px system-ui';
    ctx.fillText(s.label, x, statsY + 136);
  });

  if (data.topSubject) {
    ctx.fillStyle = BRAND.amber;
    ctx.font = 'bold 40px system-ui';
    ctx.fillText(`⭐ ${data.topSubject} foi a matéria mais estudada`, 80, 1160);
  }

  // Mini heatmap (52w × 7d, small cells)
  const cellSize = 16;
  const gap = 3;
  const hmX = 80;
  const hmY = 1240;
  const today = new Date().toISOString().slice(0, 10);

  for (let w = 0; w < 52; w++) {
    for (let d = 0; d < 7; d++) {
      const dateMs = Date.now() - ((51 - w) * 7 + (6 - d)) * 86_400_000;
      const dk = new Date(dateMs).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).split('/').reverse().join('-');

      const active = data.activeDayKeys.has(dk.replace(/\//g, '-'));
      ctx.fillStyle = active ? BRAND.indigo : BRAND.bgCard;
      roundRect(ctx, hmX + w * (cellSize + gap), hmY + d * (cellSize + gap), cellSize, cellSize, 3);
      ctx.fill();
    }
  }

  ctx.fillStyle = BRAND.gray;
  ctx.font = '32px system-ui';
  ctx.fillText('Atividade — últimas 52 semanas', 80, 1420);

  // Footer
  ctx.fillStyle = BRAND.gray;
  ctx.font = '32px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('sprint.app', 540, 1860);

  return canvasToBlob(canvas);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob failed'));
    }, 'image/png');
  });
}

/** Share blob via navigator.share or download fallback */
export async function shareOrDownload(blob: Blob, filename: string): Promise<void> {
  if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename, { type: 'image/png' })] })) {
    const file = new File([blob], filename, { type: 'image/png' });
    await navigator.share({ files: [file], title: 'Sprint' });
  } else {
    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
