import { randomBytes } from "crypto";

const ORDER_ALPH = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Código curto para URL: /pedido/8FH29JK */
export function generateOrderId(length = 7): string {
  const buf = randomBytes(length);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ORDER_ALPH[buf[i]! % ORDER_ALPH.length];
  }
  return id;
}
