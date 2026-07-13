/**
 * Respostas automáticas sem LLM pago — regras em português.
 */
import type { OrderHubPublic } from "@/lib/order-portal-shared";
import { pipelineLabel } from "@/lib/order-tracking";

export function captainAutoReply(
  message: string,
  hub: OrderHubPublic,
): string | null {
  const m = message.toLowerCase();

  if (/onde|cad[eê]|rastre|atras|demor|cheg|status|pedido/.test(m)) {
    const stage = hub.pipelineStage
      ? pipelineLabel(hub.pipelineStage)
      : hub.statusLabel;
    const code = hub.trackingCode
      ? ` Código: ${hub.trackingCode}.`
      : " O código aparece assim que o fornecedor despachar.";
    return `Olá! O Capitão verificou o pedido ${hub.orderId}. Status agora: ${stage}.${code} Qualquer novidade atualizamos sozinho na página do pedido.`;
  }

  if (/devolu|troca|reembol|quebr|defeito|errado/.test(m)) {
    return `Para devolução ou troca, use a Central do Capitão ou a seção Devolução nesta página. Motivo + descrição geram um ticket automático. Produto com defeito: troca ou reembolso. Arrependimento: até 7 dias após o recebimento (CDC).`;
  }

  if (/cancel|desistir/.test(m)) {
    return `Cancelamento só antes do envio. Se já saiu, use devolução/troca. Abra Cancelar na Central do Capitão com o e-mail da compra.`;
  }

  if (/endere[cç]o|mudar.*cep|alterar.*entrega/.test(m)) {
    return `Alteração de endereço só antes do despacho. Use “Alterar endereço” na Central do Capitão com o endereço novo completo.`;
  }

  if (/nf|nota fiscal|danfe/.test(m)) {
    return hub.invoiceReady
      ? `A nota fiscal já está na seção Nota fiscal desta página.`
      : `A NF aparece nesta página quando for emitida — sem precisar procurar no e-mail.`;
  }

  return null;
}
