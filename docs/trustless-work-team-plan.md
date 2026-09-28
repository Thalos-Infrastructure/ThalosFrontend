# Plan de trabajo — Acuerdos con Trustless Work V1

## Objetivo

Alinear el backend de V0 y el frontend de staging para que los acuerdos reflejen de forma confiable el estado real on-chain de Trustless Work V1.

El objetivo principal no es agregar más botones, sino consolidar una fuente de verdad única para:

- acuerdos;
- roles y perspectivas;
- estados del escrow y milestones;
- siguiente acción disponible;
- funding, evidencia, aprobación, release y disputas;
- navegación Dashboard → Agreements → Agreement Detail.

## Distribución del trabajo

### Manu — Coordinación y trabajo transversal

Manu puede trabajar un poco de todo, con foco en integración y seguimiento:

1. Coordinar el contrato entre backend y frontend.
2. Mantener el listado de pendientes y criterios de aceptación.
3. Revisar que los cambios de Diego y Lea sean compatibles.
4. Validar los flujos completos con wallet:
   - crear acuerdo;
   - fundar;
   - enviar evidencia;
   - aprobar milestone;
   - liberar fondos;
   - disputar;
   - refrescar dashboard y chat.
5. Revisar errores, estados bloqueados y mensajes para el usuario.
6. Coordinar pruebas de staging y revisión final.
7. Confirmar que no se mezclen payloads, endpoints o reglas de Trustless Work V1 con V2.

**Entregables de Manu**

- checklist de aceptación actualizado;
- revisión integrada de PRs;
- matriz de estados, roles y acciones;
- validación end-to-end en staging;
- reporte de bloqueos entre backend y frontend.

### Diego — Backend

Diego debe ser responsable de que el backend sea la fuente de verdad operativa y de que la API key de Trustless Work no quede expuesta en el navegador.

#### Prioridad 1: relay seguro

Implementar o consolidar endpoints server-side para:

- deploy escrow;
- fund escrow;
- change milestone status / submit evidence;
- approve milestone;
- release funds;
- dispute;
- resolve dispute.

Cada endpoint debe:

- validar JWT/sesión;
- validar la wallet firmante;
- validar el rol real contra el escrow;
- validar `serviceType` (`single-release` o `multi-release`);
- validar `contractId` y `milestoneIndex`;
- consultar el estado on-chain antes de acciones críticas;
- usar `validateOnChain=true` cuando aplique;
- devolver unsigned XDR para que la wallet firme;
- recibir y enviar signed XDR por el flujo existente;
- registrar built, signed, submitted, confirmed o failed;
- aplicar idempotencia para evitar doble funding, approve o release;
- devolver errores normalizados y accionables.

#### Prioridad 2: API key y seguridad

Actualmente el proyecto referencia `NEXT_PUBLIC_TRUSTLESSWORK_API_KEY`. Esto debe corregirse porque una variable `NEXT_PUBLIC_*` puede terminar en el bundle del navegador.

Acciones:

1. Mover la key a una variable server-only.
2. Hacer que todas las escrituras pasen por el relay backend.
3. No confiar en `role`, `amount`, `contractId` o `milestoneIndex` enviados por el cliente.
4. Recalcular y validar permisos, cantidades y participantes en backend.
5. No registrar secretos ni XDR sensibles en logs.

#### Prioridad 3: endpoint unificado de acuerdos

Crear un endpoint que devuelva acuerdos donde el usuario participa como:

- payer;
- provider/payee;
- approver;
- dispute resolver.

Debe soportar paginación y combinar datos persistidos con estado on-chain validado.

El detalle debe incluir:

- `contractId`;
- tipo de escrow;
- participantes;
- estado global;
- milestones;
- amount y balance;
- fees;
- flags de approval/release;
- perspectiva del usuario;
- siguiente acción;
- razón de bloqueo, si existe;
- última transacción;
- eventos de actividad.

#### Prioridad 4: `nextAction`

El backend debe calcular la siguiente acción válida, no dejar esta decisión únicamente al frontend.

Ejemplos:

- payer + pending funding → `fund_escrow`;
- provider + funded → `submit_evidence`;
- approver + evidence submitted → `approve_milestone`;
- release signer + approved → `release_funds`;
- rol autorizado + estado elegible → `open_dispute`;
- completed/released → `view_receipt`.

Si la acción está bloqueada, devolver `blockedReason`.

#### Prioridad 5: disputas

Para `single-release`:

- disputar el escrow completo;
- no enviar `milestoneIndex`.

Para `multi-release`:

- disputar un milestone específico;
- enviar `milestoneIndex` como string.

Antes de construir la operación:

1. consultar estado fresco on-chain;
2. validar rol y elegibilidad;
3. validar balance y reglas de distribución;
4. construir XDR;
5. devolverlo para firma;
6. confirmar la transacción y actualizar el estado.

### Lea — Fullstack, responsable principal del dominio de acuerdos

Lea debe liderar la implementación funcional de acuerdos porque tiene mayor conocimiento del dominio.

#### Prioridad 1: View Model único

Crear una representación única consumida por Personal, Business, analytics, detalle y chat:

```ts
{
  contractId,
  agreementId,
  title,
  description,
  type: "single-release" | "multi-release",
  role,
  perspective,
  escrowStatus,
  milestones,
  completedMilestones,
  totalMilestones,
  amount,
  balance,
  platformFee,
  participants,
  nextAction,
  blockedReason,
  lastTransaction,
  lastUpdated
}
```

No duplicar transformaciones diferentes en cada página.

#### Prioridad 2: navegación de acuerdos

Corregir el flujo:

```text
My Agreements → Dashboard → Agreements → Agreement Detail
```

Implementar una URL canónica, por ejemplo:

```text
/dashboard/personal?section=agreements&agreementId=...
```

Requisitos:

- “My Agreements” siempre aterriza en el dashboard;
- abrir automáticamente la sección Agreements;
- abrir el detalle si existe `agreementId`;
- conservar sección y acuerdo después de refresh;
- permitir deep-link;
- “Back to Agreements” vuelve al listado;
- aplicar el mismo patrón a Personal y Business.

#### Prioridad 3: estados y perspectivas

Separar estado global del escrow y estado del milestone.

Estados de producto:

- Initialized / Pending funding;
- Funded;
- In progress;
- Pending approval;
- Approved, solo cuando corresponda al milestone;
- Released / Completed;
- Disputed;
- Resolved;
- Cancelled, si el backend lo expone.

Perspectivas:

- I’m paying;
- I’m getting paid;
- I’m approving;
- I’m resolving a dispute.

#### Prioridad 4: acciones visuales por rol

El frontend debe renderizar `nextAction` y `blockedReason` del backend.

Reglas mínimas:

- payer nunca ve Submit Evidence;
- provider/payee no ve Fund Escrow;
- no mostrar evidencia antes de funding;
- approver revisa y aprueba;
- no permitir release antes de approval;
- single-release exige todos los milestones aprobados;
- multi-release permite release por milestone;
- no mostrar Dispute sin estado y rol elegibles.

#### Prioridad 5: milestones y evidencia

Cada milestone debe mostrar:

- índice;
- descripción;
- amount;
- estado Trustless Work normalizado;
- evidencia, cuando corresponda;
- flags de approval/release;
- acción disponible;
- progreso total `X/Y completed`.

La evidencia debe aparecer únicamente cuando el usuario sea provider/payee y el escrow ya esté funded.

#### Prioridad 6: disputa en frontend

Implementar un modal real, no un botón decorativo:

1. mostrar solo si `nextAction=open_dispute`;
2. permitir seleccionar milestone cuando sea multi-release;
3. solicitar motivo;
4. confirmar con el usuario;
5. solicitar unsigned XDR al backend;
6. firmar con wallet;
7. enviar signed XDR;
8. esperar confirmación;
9. refrescar listado, detalle, analytics y chat.

#### Prioridad 7: chat de Backend en V0

El chat del backend debe consumir el endpoint unificado, no reconstruir acuerdos desde múltiples respuestas.

Debe poder consultar:

- estado actual del escrow;
- milestones;
- rol del usuario;
- perspectiva;
- siguiente acción;
- razón por la que una acción está bloqueada;
- última transacción;
- eventos recientes.

Después de funding, evidencia, approval, release o dispute, el backend debe emitir o registrar un evento para que dashboard y chat se actualicen.

## Hallazgos concretos en staging FE

1. Ya existe integración con Trustless Work y separación entre single-release y multi-release.
2. El servicio ya maneja XDR sin firmar y el flujo de wallet.
3. La lectura principal usa validación on-chain en varias rutas.
4. La disputa ya tiene parte del servicio, pero todavía no existe el flujo completo de UI y confirmación.
5. Personal y Business todavía tienen transformaciones propias de acuerdos.
6. El dashboard ya incluye acuerdos propios y escrows donde el usuario aparece como approver, pero debe consolidarse en un endpoint/View Model único.
7. La navegación fue corregida parcialmente, pero debe pasar de estado local a deep-link persistente.
8. La evidencia ya se ocultó para payer y acuerdos pendientes de funding.
9. El sidebar y su comportamiento de navegación ya fueron refinados; no es el bloqueo principal actual.
10. Las analytics de Business ya dejaron de usar métricas totalmente fijas, pero deben depender del View Model unificado.

## Orden de ejecución recomendado

### Sprint 1 — Diego

1. Relay server-side.
2. API key server-only.
3. Validación de sesión, wallet, rol y service type.
4. Endpoint unificado de acuerdos y detalle.
5. `nextAction` y `blockedReason`.
6. Idempotencia, eventos y errores normalizados.

### Sprint 2 — Lea

1. View Model único.
2. Navegación canónica Dashboard → Agreements.
3. Estados y perspectivas.
4. Acciones de funding, evidencia, approval y release.
5. Progreso de milestones.
6. Disputa real single/multi.
7. Integración del chat con el contrato unificado.

### Sprint 3 — Manu

1. Revisión transversal de contratos backend/frontend.
2. Pruebas de permisos y roles.
3. Pruebas con estado on-chain fresco.
4. Pruebas de doble submit y stale state.
5. Validación de trustlines y red.
6. QA end-to-end en Personal, Business y chat.
7. Preparar release de staging.

## Criterios de aceptación

- Un acuerdo confirmado on-chain aparece en My Agreements.
- My Agreements siempre abre Dashboard → Agreements.
- Refresh y deep-link conservan el acuerdo seleccionado.
- Payer no puede enviar evidencia.
- Provider no puede fundar como payer.
- No se puede liberar sin aprobación válida.
- Single-release exige todos los milestones aprobados.
- Multi-release libera milestone por milestone.
- Dispute aparece solo para rol y estado válidos.
- Las acciones críticas consultan estado on-chain fresco.
- La API key no aparece en el bundle del navegador.
- Dashboard, analytics y chat se actualizan después de cada transacción.
- El backend devuelve una explicación cuando una acción está bloqueada.

## Prompt sugerido para el chat Backend de V0

> Revisar y completar la integración de acuerdos con Trustless Work V1. Implementar un relay server-side para deploy, fund, change milestone status, approve milestone, release, dispute y resolve. La API key debe ser server-only. Validar JWT, wallet firmante, rol on-chain, serviceType, contractId y milestoneIndex. Usar validateOnChain=true antes de acciones críticas. Devolver unsigned XDR para firma del frontend y registrar el ciclo built/signed/submitted/confirmed/failed. Crear endpoints unificados de listado y detalle de acuerdos, con paginación, participantes, escrowStatus, milestoneStatus, perspective, nextAction y blockedReason. Agregar idempotencia, errores normalizados y eventos post-transacción para actualizar dashboard y chat. Mantener separadas las reglas single-release y multi-release de Trustless Work V1.

## Nota final

La responsabilidad principal de Diego es que la operación sea segura y fiel a Trustless Work. La responsabilidad principal de Lea es que el dominio de acuerdos quede correctamente modelado y reflejado en toda la experiencia. Manu debe asegurar que ambas partes se integren y que el flujo completo funcione en staging sin inconsistencias.
