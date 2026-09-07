/**
 * HARBOR PASO S.4 — Registro de consumidores del outbox.
 *
 * Un consumidor recibe el evento y produce un efecto externo (una notificación,
 * una proyección, una integración). DEBE ser idempotente: la entrega es
 * at-least-once y el despachador puede reintentar. La idempotencia se garantiza
 * en dos capas:
 *   1. `OutboxDelivery(eventId, consumer)` @unique — el despachador no vuelve a
 *      llamar a un consumidor que ya procesó ese evento;
 *   2. cada consumidor deduplica además por su llave natural (aquí:
 *      `CustomerNotification.dedupeKey`).
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OutboxEventRecord = {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payloadJson: Prisma.JsonValue;
};

export type Consumer = {
  name: string;
  handles: (eventType: string) => boolean;
  handle: (event: OutboxEventRecord) => Promise<void>;
};

/**
 * Consumidor #1: notifica al cliente que su paquete llegó a bodega.
 * Deja la notificación en `QUEUED` — el canal real (WhatsApp/SMS/email) está
 * fuera de alcance de este paso.
 */
const packageReceivedNotifier: Consumer = {
  name: "customer-notification",
  handles: (t) => t === "receiving.package_received.v1",
  async handle(event) {
    const p = (event.payloadJson ?? {}) as Record<string, unknown>;
    const customerId = typeof p.customerId === "string" ? p.customerId : null;
    if (!customerId) return; // un ORPHAN no notifica a nadie hasta que se asigne

    const trackingCode = String(p.trackingCode ?? "");
    const modeLabel = p.mode === "SEA" ? "Marítima" : "Aérea";
    const weight = p.weightOriginLb != null ? `${Number(p.weightOriginLb).toFixed(1)} lb` : "pendiente";
    const amount =
      p.quoteSubtotal != null
        ? `${p.quoteCurrency === "NIO" ? "C$" : "$"}${Number(p.quoteSubtotal).toFixed(2)}`
        : "pendiente";
    const body = `Tu paquete ${trackingCode} esta en bodega Doral. Modalidad: ${modeLabel} · Peso: ${weight} · A pagar: ${amount}`;

    const dedupeKey = `PACKAGE_RECEIVED:${event.aggregateId}`;
    await prisma.customerNotification.upsert({
      where: { dedupeKey },
      update: {}, // ya existe → no-op (idempotente)
      create: {
        customerId,
        kind: "PACKAGE_RECEIVED",
        subjectRef: event.aggregateId,
        body,
        dedupeKey,
      },
    });
  },
};

export const CONSUMERS: readonly Consumer[] = [packageReceivedNotifier];
