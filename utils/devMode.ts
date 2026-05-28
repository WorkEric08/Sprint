// Modo desenvolvedor: ativado quando o nome do usuário é "DevInfo"
// (qualquer combinação de maiúsculas/minúsculas). Quando ativo, ações de
// "pular" / "encerrar" em telas de tempo (blocos de estudo, simulado, redação)
// são contabilizadas como se o tempo completo tivesse decorrido.
export function isDevModeUser(name: string | null | undefined): boolean {
  return (name ?? '').trim().toLowerCase() === 'devinfo';
}
