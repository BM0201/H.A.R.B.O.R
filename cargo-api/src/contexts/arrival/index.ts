/**
 * Contexto: arrival  (confianza: Media)
 *
 * Arribo a Nicaragua: descarga, verificación, clasificación. Se solapa con Warehouse/Shipment — puede NO ser contexto propio.
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/arrival/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
