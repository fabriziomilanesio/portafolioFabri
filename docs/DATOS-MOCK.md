# Datos mock de los simuladores

Especificación de los datos que alimentan el **Interactive QA Playground**.
Todos viven en [`assets/js/content.es.js`](../assets/js/content.es.js) y su espejo en
inglés [`content.en.js`](../assets/js/content.en.js), y están escritos para que
un QA Lead los lea y reconozca el trabajo real detrás: nada de *lorem ipsum*.

> **Contexto ficticio pero verosímil:** migración del core de cuentas de un banco
> desde COBOL hacia microservicios. Dominio, códigos de error, headers y consultas
> replican los de un proyecto fintech real (nombres, cuentas e importes son inventados).

---

## 1. Colección de API — `apiCollection`

**Colección:** `Banco de Chile — Core Migration API` · entorno `QA / Staging` · base `https://api.qa.bdc-core.cl`

| Request | Método | Endpoint | Escenarios |
|---|---|---|---|
| Estado de migración de cuenta | `GET` | `/api/v1/accounts/{accountId}/migration-status` | ✅ Cuenta migrada (200) · ❌ Descuadre de saldo |
| Transferencia entre cuentas | `POST` | `/api/v1/transfers` | ✅ Aceptada (201) · ❌ Fondos insuficientes (422) |
| Obtención de token OAuth2 | `POST` | `/api/v1/auth/token` | ✅ Credenciales válidas (200) · ❌ Inválidas (401) |

### Esquema de un escenario

```js
{
  id: 'happy',
  label: 'Cuenta migrada · 200 OK',
  type: 'positive' | 'negative',
  request:  { method, url, headers: {…}, body: {…} | null },
  response: { status, statusText, time, size, headers: {…}, body: {…} },
  tests:    [{ name, passed, ms, error? }],
  console:  ['línea de log del runner', …]
}
```

### Assertions destacadas

| Escenario | Assertions | Resultado |
|---|---|---|
| `migration-status` · happy | 8 | 8 PASS — saldo legacy = saldo microservicio, `checksumMatch`, 0 movimientos pendientes |
| `migration-status` · descuadre | 8 | **5 PASS / 3 FAIL** — `expected 842300 to equal 842300.5` → deriva en el ticket BDC-1042 |
| `transfers` · created | 7 | 7 PASS — incluye verificación de idempotencia con reenvío del mismo request |
| `transfers` · fondos insuficientes | 6 | 6 PASS — 422 `application/problem+json` (RFC 7807), código `CORE-4221`, sin escritura en base |
| `auth/token` · válido | 5 | 5 PASS — `expires_in = 900`, scopes, `Cache-Control: no-store` (OWASP ASVS) |
| `auth/token` · inválido | 4 | 4 PASS — sin *user enumeration*, sin stack trace |

**Detalles deliberados** (lo que un QA senior busca en un portafolio):

- Headers de trazabilidad `X-Correlation-Id` que después se usan para buscar en Splunk.
- `X-Idempotency-Key` en las transferencias y una assertion que valida el reintento.
- Errores en formato **RFC 7807** (`application/problem+json`) con código de negocio.
- Casos negativos tratados como ciudadanos de primera, no como excepción.
- Assertions de seguridad (mensajes genéricos, cabeceras de caché).

---

## 2. Tickets de bugs — `bugBoard`

**Proyecto:** `BDC — Core Migration` · **Sprint 14 · Migración COBOL → Microservicios**

| Key | Severidad | Estado | Título |
|---|---|---|---|
| `BDC-1042` | **Blocker** | En verificación | Truncamiento de decimales en saldos migrados desde COBOL (CLP 0,50) |
| `BDC-0987` | Critical | Cerrado | Reintento con la misma `X-Idempotency-Key` duplica el movimiento |
| `BDC-1105` | Major | Reportado | El endpoint de transferencias acepta montos negativos y responde 201 |
| `ODA-338` | Major | En desarrollo | La progresión del jugador no persiste al reconectar (nivel 7) |
| `EPM-274` | Minor | Cerrado | El error del formulario no se anuncia a lectores de pantalla (WCAG 3.3.1) |

### Anatomía de cada ticket

```js
{
  key, column, type, severity, priority, title,
  component, environment, reporter, assignee, foundIn,
  steps: [],          // pasos numerados, reproducibles sin preguntar nada
  expected, actual,   // esperado vs. actual, explícitos
  impact,             // por qué le importa al negocio
  logs: [],           // evidencia de CloudWatch / Splunk
  rootCause?,         // causa raíz cuando se identificó
  resolution?,        // fix + re-test cuando está cerrado
  evidence: [],       // adjuntos
  labels: []
}
```

Los cinco tickets cubren a propósito cinco perfiles distintos de defecto:
**integridad de datos**, **concurrencia/idempotencia**, **seguridad de contrato**,
**gameplay/UX** y **accesibilidad**. Y tres industrias: banca, gaming y enterprise.

Cada ticket se puede **copiar en Markdown** listo para pegar en Jira.

---

## 3. Consultas SQL — `sqlLab`

**Motor:** Oracle 19c vía DBeaver · esquemas `CORE` / `LEGACY` · conexión de solo lectura.

| Consulta | Objetivo | Veredicto |
|---|---|---|
| Conciliación de saldos legacy vs microservicio | Detectar cuentas cuyo saldo migrado no coincide | ❌ 1.284 cuentas con descuadre → `BDC-1042` |
| Movimientos duplicados por clave de idempotencia | Verificar que un reintento no genere doble débito | ❌ 2 movimientos para la misma clave → `BDC-0987` |
| Integridad referencial post-migración | Que no queden movimientos huérfanos | ✅ 0 registros huérfanos |
| Cuadratura diaria por tipo de producto | Comparar totales agregados entre sistemas | ✅ Delta 0,00 tras el fix |

Cada consulta incluye una **“Lectura de QA”**: qué revela ese resultado y cómo
acotó la investigación. Ejemplo real del set:

> Todas las diferencias son fracciones menores a 1 peso: patrón claro de
> truncamiento de decimales, no de pérdida de movimientos. Ese dato acotó la
> investigación al mapper del job de migración.

---

## 4. Hilo narrativo entre los tres módulos

Los datos no son independientes: cuentan **una sola historia**, y esa es la razón
por la que el Playground convence.

```
API Testing                     Database                    Bug Tracker
───────────                     ────────                    ───────────
GET /migration-status
escenario "descuadre"     →     SELECT de conciliación  →   BDC-1042 (Blocker)
3 assertions FAIL               1.284 filas con delta       causa raíz: DECIMAL(15,0)
correlationId 7c2a55de          evidencia exportada         logs de CloudWatch y Splunk
                                                                    │
                                                                    ▼
                                                            Cuadratura post-fix
                                                            delta = 0,00 ✅
```

Lo mismo ocurre con la idempotencia: la assertion del `POST /transfers`, la query
de duplicados y el ticket `BDC-0987` describen el mismo defecto desde tres ángulos.

---

## 5. Cómo editar los mocks

Todo el contenido se edita en `assets/js/content.es.js` y `assets/js/content.en.js`, sin
tocar lógica. Los `id` deben coincidir entre ambos idiomas: es lo que permite que el
estado del Playground sobreviva al cambio de idioma.

- **Agregar un request:** sumá un objeto a `apiCollection.requests` con al menos un escenario.
  La carpeta (`folder`) se agrupa sola en el sidebar.
- **Agregar un ticket:** sumá un objeto a `bugBoard.tickets` con un `column` válido
  (`open`, `progress`, `review`, `done`). El contador de la columna se recalcula.
- **Agregar una consulta:** sumá un objeto a `sqlLab.queries` con `columns` y `rows`
  del mismo largo; `verdict` acepta `pass` o `fail`.

Las celdas se resaltan solas: valor `0` en una consulta `pass` se pinta en verde y
las columnas `DIFERENCIA`, `MOVIMIENTOS` y `SALDO_MICROSERVICIO` en rojo cuando el
veredicto es `fail`.
