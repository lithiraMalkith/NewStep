import type { Order } from "./types";

const KEY = "newstep.orders.v1";

export const orderNumber = () =>
  "NS-" + String(Date.now()).slice(-6) + "-" + Math.floor(10 + Math.random() * 89);

export function saveOrder(order: Order) {
  const all = readOrders();
  all[order.id] = order;
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function readOrders(): Record<string, Order> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, Order>;
  } catch {
    return {};
  }
}

export const readOrder = (id: string) => readOrders()[id] ?? null;
