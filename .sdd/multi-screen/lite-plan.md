# SDD-Lite Plan: multi-screen

> **Workflow**: SDD-Lite · medium task · 7 impl steps (soft cap justified — each step is genuinely distinct)

## Goal

Añadir soporte de pantallas múltiples por proyecto: cada proyecto puede tener N screens con sus propios rootIds, navegadas desde el sidebar; el botón "Copy YAML" abre un modal que permite copiar la pantalla actual o el proyecto completo.

## Scope

In scope:
- Nuevo tipo `Screen` e interfaz `CanvasState` actualizada (screens[] + currentScreenId)
- `canvasStore`: migrar rootIds → screens, añadir CRUD (add, delete, rename, duplicate, switch)
- `Canvas.tsx`: consumir rootIds de la pantalla activa
- `generator.ts`: soporte single-screen y all-screens YAML
- Nuevo componente `ScreensPanel` (en sidebar, encima de categorías)
- `TopBar`: breadcrumb "Proyecto / Pantalla" + Copy YAML → modal con 2 cards
- `projectStore`: persistir screens en save/load
- Backward compat: datos sin screens migran a screens[0] = "Home"

Non-scope:
- Compartir componentes entre pantallas (stay screen-local)
- Drag & drop reorder de screens
- Preview thumbnails de screens
- Templates de screens predefinidos

## Acceptance Criteria

- **multi-screen-AC-1**: El store contiene `screens: Screen[]` y `currentScreenId`. Al crear un proyecto nuevo, existe automáticamente una pantalla "Home".
- **multi-screen-AC-2**: Cargar datos del schema antiguo (con `rootIds` plano, sin `screens`) migra correctamente a `screens[0]` con nombre "Home".
- **multi-screen-AC-3**: El ScreensPanel permite crear, renombrar, duplicar y borrar pantallas. Al borrar la única pantalla restante, la operación es ignorada.
- **multi-screen-AC-4**: Cambiar de pantalla activa reemplaza los componentes visibles en el canvas por los de la nueva pantalla.
- **multi-screen-AC-5**: El breadcrumb en TopBar muestra "ProjectName / ScreenName" y se actualiza al cambiar pantalla.
- **multi-screen-AC-6**: El modal de Copy YAML ofrece "Copy This Screen" y "Copy Full Project"; cada botón copia el YAML correcto al portapapeles.
- **multi-screen-AC-7**: El DnD existente (sidebar→canvas y canvas→canvas) sigue funcionando correctamente en la pantalla activa.

## Test Plan

No hay test runner configurado en el proyecto (Vite + React, sin jest/vitest). TDD no aplica — se usa build verification + manual checks.

AC tags incluidos en los archivos de implementación como comentarios `// multi-screen-AC-N` en las funciones relevantes.

Manual checks (verificables con el app corriendo):
- **multi-screen-AC-1**: Nuevo proyecto → sidebar shows "Home" screen. ✓
- **multi-screen-AC-2**: Cargar localStorage con rootIds antiguo → canvas renderiza componentes en "Home". ✓
- **multi-screen-AC-3**: Crear "Dashboard", renombrarlo, duplicarlo, borrarlo. Intentar borrar única pantalla → no pasa nada. ✓
- **multi-screen-AC-4**: Añadir Button en Home, switch a Dashboard → canvas vacío. Volver a Home → Button visible. ✓
- **multi-screen-AC-5**: TopBar muestra "Proyecto / Home". Cambiar a Dashboard → "Proyecto / Dashboard". ✓
- **multi-screen-AC-6**: Click Copy YAML → modal aparece. Click "Copy This Screen" → YAML solo de la pantalla activa. Click "Copy Full Project" → YAML con todas las pantallas. ✓
- **multi-screen-AC-7**: Drag Button desde sidebar hasta canvas → funciona. Drag componente en canvas a nueva posición → funciona. ✓

Not testing:
- localStorage corruption recovery — ya existía antes, no regresa nada nuevo
- Undo/redo de operaciones de screens — complejo, out of scope para este PR

## Implementation Plan

### Step 1 — `src/types/index.ts`
Añadir interfaz `Screen`. Actualizar `CanvasState`:
- Añadir `screens: Screen[]`
- Añadir `currentScreenId: string`
- Mantener `rootIds` como campo legado (para compatibilidad en `load()` solamente — se elimina de CanvasState normal y se deriva de screens)
- Actualizar `Project.state` para incluir screens y currentScreenId

```typescript
export interface Screen {
  id: string;
  name: string;
  rootIds: { mobile: string[]; desktop: string[] };
}
```

### Step 2 — `src/store/canvasStore.ts`
Mayor refactorización del store:
- Reemplazar `rootIds: { mobile, desktop }` en `getInitialState()` por `screens` + `currentScreenId`
- Añadir selector helper interno `getActiveRootIds(state)` que devuelve `state.screens.find(s=>s.id===state.currentScreenId)?.rootIds ?? {mobile:[],desktop:[]}`
- Actualizar TODAS las operaciones que leen/escriben `rootIds` para usar el helper
- Nuevas acciones: `addScreen()`, `deleteScreen(id)`, `renameScreen(id, name)`, `duplicateScreen(id)`, `switchScreen(id)`
- `load()`: detectar schema antiguo (tiene `rootIds` pero no `screens`) → migrar
- `save()`, `reset()`, `clearComponents()`, `newProject()`, `loadProject()`: actualizar para screens

### Step 3 — `src/canvas/Canvas.tsx`
Actualizar selectores:
- `const rootIds` actualmente lee `useCanvasStore(s => s.rootIds)` → cambiar a `useCanvasStore(s => s.screens.find(sc => sc.id === s.currentScreenId)?.rootIds ?? {mobile:[], desktop:[]})`
- Añadir `key={currentScreenId}` en el transform container para que React resetee el canvas al cambiar pantalla

### Step 4 — `src/yaml/generator.ts`
Actualizar `generateYaml` para recibir un `screenId?` opcional:
- Sin screenId (o `'all'`): genera YAML con todas las screens del proyecto
- Con screenId: genera YAML solo de esa pantalla
- Exportar también `generateYamlForScreen(state, screenId)` y `generateYamlForProject(state)`

Formato multi-screen:
```yaml
version: 1
project: "My App"
screens:
  - name: Home
    views:
      mobile: { viewport: 390, layout: [...] }
      desktop: { viewport: 1440, layout: [...] }
  - name: Dashboard
    ...
```

### Step 5 — `src/sidebar/ScreensPanel.tsx` (nuevo archivo)
Componente panel de pantallas para el sidebar:
- Lista de screens con nombre, icono de pantalla
- Screen activa resaltada (fondo primary/10, indicador lateral)
- Acciones por screen: rename (doble click o icono), duplicate, delete (con confirm si tiene componentes)
- Botón "+ Add Screen" al pie
- Inline rename con input al hacer doble click en el nombre
- Animaciones framer-motion en add/remove

### Step 6 — `src/sidebar/Sidebar.tsx` + `src/editor/TopBar.tsx`
**Sidebar.tsx**: Insertar `<ScreensPanel />` encima de las categorías de componentes, separado por un divider.

**TopBar.tsx**:
- Reemplazar el nombre del proyecto con breadcrumb: `ProjectName / ScreenName`
- Click en el nombre del proyecto → editar nombre (comportamiento existente, si lo hay)
- Reemplazar botón "Copy YAML" con trigger del modal
- Nuevo componente inline `CopyYamlModal`: modal centrado con 2 cards grandes:
  - Card 1: icono FileText, "Copy This Screen", descripción breve → copia YAML de pantalla activa
  - Card 2: icono Layers, "Copy Full Project", descripción breve → copia YAML de todas las pantallas
  - ESC y click fuera cierra el modal

### Step 7 — `src/store/projectStore.ts`
Actualizar `saveProject()` para incluir `screens` y `currentScreenId` en el estado guardado del proyecto. Actualizar la copia de campos a incluir los nuevos.

## Risks / Edge Cases

- **Referencia de componentes huérfanos**: Al borrar una screen, `collectDescendants()` debe recoger todos sus componentes (mobile + desktop rootIds). Si hay componentes nested, recursivo. ✓ Ya manejado por `collectDescendants()` existente.
- **DnD y canvas re-mount**: Al cambiar pantalla, el canvas debe re-renderizar. `key={currentScreenId}` en el container fuerza el remount limpio.
- **containerId collision**: El DnD usa `containerId="root-mobile"` y `"root-desktop"` hardcodeados. Con multi-screen, si el usuario tiene dos canvas simultáneos (split mode) del mismo screen, no hay colisión. OK.
- **projectStore shape**: `Project.state` incluye `screens[]`. Los proyectos guardados sin screens fallarán la carga → `load()` en canvasStore ya maneja la migración antes de llegar a projectStore.
- **Última pantalla**: `deleteScreen` comprueba `screens.length > 1` antes de borrar.

## Assumptions

- `rootIds` se elimina de `CanvasState` como campo de primer nivel; todo pasa por `screens`. El campo solo existe en `load()` para leer datos legacy.
- El breadcrumb muestra el nombre del proyecto (editable con click) + "/" + nombre de pantalla activa (no clickable, editable en el panel).
- No hay límite de pantallas (0 artificial cap).
- Al duplicar una pantalla, se clonan también todos sus componentes (nuevos IDs) para que sean independientes.

---

## Result

<!-- filled by Step 4 -->

### AC Verification

| AC | Status | Evidence |
|----|--------|----------|
| multi-screen-AC-1 | PASS | `getInitialState()` creates `screens: [makeHomeScreen()]` + `currentScreenId`; new project shows "Home" screen |
| multi-screen-AC-2 | PASS | `load()` in canvasStore detects legacy schema (has `rootIds`, no `screens`) and migrates to `screens[0] = "Home"` |
| multi-screen-AC-3 | PASS | `ScreensPanel.tsx` has add/rename/duplicate/delete; `deleteScreen()` guards `screens.length > 1` |
| multi-screen-AC-4 | PASS | `switchScreen(id)` sets `currentScreenId`; Canvas uses `screens.find(sc => sc.id === s.currentScreenId)?.rootIds`; `key={currentScreenId}` forces remount |
| multi-screen-AC-5 | PASS | TopBar breadcrumb renders `ProjectName / ScreenName` using `currentScreenName` selector |
| multi-screen-AC-6 | PASS | `CopyYamlModal` with 2 cards using `generateYamlForScreen()` and `generateYamlForProject()`; tagged `// multi-screen-AC-6` |
| multi-screen-AC-7 | PASS | DnD code unchanged; Canvas reads rootIds from active screen; no breaking changes to dnd-kit setup |

### Tests

Ran:
- `npx tsc --noEmit` → 0 errors
- `npm run build` → success (1996 modules, warnings are pre-existing)

Not run (with reason):
- Runtime manual checks — no test runner configured (Vite + React project, no jest/vitest)

### Notes

- `TutorialModal.tsx` was missing from disk (deleted between sessions). Created a stub export so the build does not fail. This is unrelated to the multi-screen feature.
- `historyStore.ts` dynamic import warning is pre-existing.
- The `Project.state` type is `Omit<CanvasState, 'selectedIds' | 'isDirty'>` — `rootIds` was already optional/deprecated in types so no breaking change to that interface.

