import { Document } from 'yaml';
import type { CanvasState, CanvasComponent, YamlComponentNode, Screen } from '@/types';

function componentToYaml(
  id: string,
  components: Record<string, CanvasComponent>
): YamlComponentNode {
  const comp = components[id];
  if (!comp) throw new Error(`Component ${id} not found`);

  const node: YamlComponentNode = {
    type: comp.type,
  };

  if (comp.name && comp.name !== comp.type) {
    node.name = comp.name;
  }

  if (comp.semantic.role) node.role = comp.semantic.role;
  if (comp.semantic.description) node.description = comp.semantic.description;

  // Content fields — only emit non-empty
  if (comp.content.title) node.title = comp.content.title;
  if (comp.content.subtitle) node.subtitle = comp.content.subtitle;
  if (comp.content.text) node.text = comp.content.text;
  if (comp.content.label) node.label = comp.content.label;
  if (comp.content.placeholder) node.placeholder = comp.content.placeholder;
  if (comp.content.src) node.src = comp.content.src;
  if (comp.content.href) node.href = comp.content.href;
  if (comp.content.alt) node.alt = comp.content.alt;

  // Layout — only emit meaningful overrides
  const layoutKeys: Array<keyof typeof comp.layout> = [
    'width', 'height', 'padding', 'margin', 'gap', 'borderRadius',
  ];
  const layoutOut: YamlComponentNode['layout'] = {};
  let hasLayout = false;

  for (const key of layoutKeys) {
    const val = comp.layout[key];
    if (val !== undefined && val !== 'auto' && val !== 0) {
      (layoutOut as Record<string, unknown>)[key] = val;
      hasLayout = true;
    }
  }

  if (comp.type === 'row') { layoutOut.direction = 'row'; hasLayout = true; }
  if (comp.type === 'column') { layoutOut.direction = 'column'; hasLayout = true; }

  if (hasLayout) node.layout = layoutOut;

  // Recurse children
  if (comp.children.length > 0) {
    node.children = comp.children
      .filter((cid) => components[cid])
      .map((cid) => componentToYaml(cid, components));
  }

  return node;
}

function screenToYamlNode(
  screen: Screen,
  components: Record<string, CanvasComponent>,
  frameSizes: CanvasState['frameSizes']
) {
  return {
    name: screen.name,
    views: {
      mobile: {
        viewport: frameSizes.mobile.w,
        layout: screen.rootIds.mobile
          .filter((id) => components[id])
          .map((id) => componentToYaml(id, components)),
      },
      desktop: {
        viewport: frameSizes.desktop.w,
        layout: screen.rootIds.desktop
          .filter((id) => components[id])
          .map((id) => componentToYaml(id, components)),
      },
    },
  };
}

// multi-screen-AC-6
export function generateYamlForScreen(state: CanvasState, screenId: string): string {
  const { components, screens, projectName, frameSizes } = state;
  const screen = screens.find((s) => s.id === screenId);
  if (!screen) throw new Error(`Screen ${screenId} not found`);

  const doc = new Document();
  doc.contents = doc.createNode({
    version: 1,
    project: projectName,
    screen: screenToYamlNode(screen, components, frameSizes),
  });
  return doc.toString();
}

// multi-screen-AC-6
export function generateYamlForProject(state: CanvasState): string {
  const { components, screens, projectName, frameSizes } = state;
  const doc = new Document();
  doc.contents = doc.createNode({
    version: 1,
    project: projectName,
    screens: screens.map((screen) => screenToYamlNode(screen, components, frameSizes)),
  });
  return doc.toString();
}

export function generateYaml(state: CanvasState): string {
  return generateYamlForScreen(state, state.currentScreenId);
}

export function getYamlLineCount(yamlStr: string): number {
  return yamlStr.split('\n').length;
}
