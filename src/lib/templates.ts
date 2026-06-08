import { 
  Briefcase, LayoutDashboard, Newspaper, ShoppingCart, BarChart, 
  FileText, CreditCard, Lock, Settings, User, Mail, HelpCircle, 
  Send, Star, ImageIcon, AlertTriangle, CheckCircle, Link as LinkIcon 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CanvasComponent, ComponentType } from '@/types';
import { createComponent } from '@/lib/componentFactory';

// ─── Template DSL ─────────────────────────────────────────────────────────────

interface NodeProps {
  name?: string;
  aiContext?: string;
  layout?: Record<string, string>;
  style?: Record<string, string>;
  props?: Record<string, unknown>;
}

interface NodeDef {
  type: ComponentType;
  props?: NodeProps;
  children?: NodeDef[];
}

interface BuildResult {
  components: Record<string, CanvasComponent>;
  rootIds: { mobile: string[]; desktop: string[] };
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  build: () => BuildResult;
}

function buildNode(
  def: NodeDef,
  parentId: string | null,
  components: Record<string, CanvasComponent>
): string {
  const { type, props = {}, children = [] } = def;

  const contextParts: string[] = [];
  if (props.aiContext) contextParts.push(props.aiContext);
  if (props.layout) contextParts.push('layout:' + JSON.stringify(props.layout));
  if (props.style) contextParts.push('style:' + JSON.stringify(props.style));

  const contentProps = props.props ?? {};
  const content: Partial<CanvasComponent['content']> = {};

  if (typeof contentProps.text === 'string') {
    if (type === 'heading') content.title = contentProps.text;
    else if (type === 'button' || type === 'badge' || type === 'tag' || type === 'link') content.label = contentProps.text;
    else content.text = contentProps.text;
  }
  if (typeof contentProps.label === 'string') content.label = contentProps.label;
  if (typeof contentProps.placeholder === 'string') content.placeholder = contentProps.placeholder;
  if (typeof contentProps.alt === 'string') content.alt = contentProps.alt;
  if (typeof contentProps.src === 'string') content.src = contentProps.src;
  if (typeof contentProps.href === 'string') content.href = contentProps.href;
  if (typeof contentProps.variant === 'string') content.variant = contentProps.variant;

  const variant = contentProps.variant as string | undefined;
  const semanticRole = (type === 'button' && variant === 'primary') ? 'primary-action' as const
    : (type === 'button' && variant === 'destructive') ? 'destructive-action' as const
    : undefined;

  const layoutOverrides: Partial<CanvasComponent['layout']> = {};
  if (props.layout) {
    const w = props.layout.width;
    const h = props.layout.height;
    if (w !== undefined) {
      const n = Number(w);
      layoutOverrides.width = isNaN(n) ? (w as 'auto' | '100%') : n;
    }
    if (h !== undefined) {
      const n = Number(h);
      layoutOverrides.height = isNaN(n) ? 'auto' : n;
    }
  }

  const comp = createComponent(type, {
    parentId,
    name: props.name ?? undefined,
    layout: layoutOverrides as CanvasComponent['layout'],
    content,
    semantic: {
      role: semanticRole,
      description: contextParts.length ? contextParts.join(' | ') : undefined,
    },
  });

  components[comp.id] = comp;

  for (const child of children) {
    const childId = buildNode(child, comp.id, components);
    comp.children.push(childId);
  }

  return comp.id;
}

function buildNodes(mobileNodes: NodeDef[], desktopNodes: NodeDef[]): BuildResult {
  const components: Record<string, CanvasComponent> = {};
  const mobileRoots: string[] = [];
  const desktopRoots: string[] = [];

  for (const def of mobileNodes) {
    mobileRoots.push(buildNode(def, null, components));
  }
  for (const def of desktopNodes) {
    desktopRoots.push(buildNode(def, null, components));
  }

  return { components, rootIds: { mobile: mobileRoots, desktop: desktopRoots } };
}

// ─── Shared Structural Nodes ──────────────────────────────────────────────────

const DesktopNavbar: NodeDef = {
  type: 'navbar',
  props: { name: 'Navbar', aiContext: 'Desktop navigation bar with logo on left and nav links on right.', layout: { padding: 'p-6', justify: 'justify-between' } },
};

const MobileNavbar: NodeDef = {
  type: 'navbar',
  props: { name: 'Navbar', aiContext: 'Mobile navigation bar with logo centered and hamburger menu icon.', layout: { padding: 'p-4', justify: 'justify-between' } },
};

const DesktopFooter: NodeDef = {
  type: 'footer',
  props: { name: 'Footer', aiContext: 'Desktop footer with links, copyright, and social icons.', layout: { padding: 'p-12', justify: 'justify-between' } },
};

const MobileFooter: NodeDef = {
  type: 'footer',
  props: { name: 'Footer', aiContext: 'Mobile footer with copyright and essential links stacked.', layout: { padding: 'p-8', align: 'center', gap: 'gap-6' } },
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const TEMPLATES: Template[] = [
  {
    id: 'portfolio',
    name: 'Personal Portfolio',
    category: 'Landing Pages',
    description: 'Minimalist portfolio to showcase your work, experience, and skills. Optimized layouts for desktop reading and mobile viewing.',
    icon: Briefcase,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'hero',
          props: { aiContext: 'Hero section with two-column layout: text/CTA on left, profile photo on right.', layout: { padding: '80' } },
          children: [
            { type: 'row', props: { layout: { gap: '80', align: 'center' } }, children: [
              { type: 'column', props: { aiContext: 'Text side with badge, name, bio, stats, and CTA buttons.', layout: { gap: '24' } }, children: [
                { type: 'badge', props: { props: { text: '👋 Open to Work' } } },
                { type: 'heading', props: { props: { text: 'Alex Johnson', level: 'h1' } } },
                { type: 'text', props: { props: { text: 'Senior Frontend Engineer specializing in React, TypeScript, and modern web development.' } } },
                { type: 'row', props: { aiContext: 'Stats row: years of experience, project count, client count.', layout: { gap: '48' } }, children: [
                  { type: 'column', children: [
                    { type: 'heading', props: { props: { text: '8+', level: 'h3' } } },
                    { type: 'text', props: { props: { text: 'Years Exp.' } } }
                  ]},
                  { type: 'column', children: [
                    { type: 'heading', props: { props: { text: '60+', level: 'h3' } } },
                    { type: 'text', props: { props: { text: 'Projects' } } }
                  ]},
                  { type: 'column', children: [
                    { type: 'heading', props: { props: { text: '30+', level: 'h3' } } },
                    { type: 'text', props: { props: { text: 'Clients' } } }
                  ]}
                ]},
                { type: 'row', props: { aiContext: 'CTA buttons: primary View Projects and outline Download CV.', layout: { gap: '16' } }, children: [
                  { type: 'button', props: { props: { text: 'View Projects', variant: 'primary' } } },
                  { type: 'button', props: { props: { text: 'Download CV', variant: 'outline' } } }
                ]}
              ]},
              { type: 'column', props: { aiContext: 'Profile photo side, centered, circular avatar.', layout: { align: 'center' } }, children: [
                { type: 'image', props: { layout: { width: '400', height: '400' }, style: { rounded: 'rounded-full' } } }
              ]}
            ]}
          ]
        },
        {
          type: 'section',
          props: { aiContext: 'Tech stack / skills section on a raised surface.', layout: { padding: '64' }, style: { background: 'bg-surface-raised' } },
          children: [
            { type: 'column', props: { layout: { gap: '20', align: 'center' } }, children: [
              { type: 'heading', props: { props: { text: 'Tech Stack', level: 'h2' } } },
              { type: 'text', props: { props: { text: 'Technologies I work with every day', variant: 'muted' } } },
              { type: 'row', props: { layout: { gap: '10', wrap: 'wrap' } }, children: [
                { type: 'badge', props: { props: { text: 'React' } } },
                { type: 'badge', props: { props: { text: 'TypeScript' } } },
                { type: 'badge', props: { props: { text: 'Next.js' } } },
                { type: 'badge', props: { props: { text: 'Tailwind CSS' } } },
                { type: 'badge', props: { props: { text: 'Node.js' } } },
                { type: 'badge', props: { props: { text: 'PostgreSQL' } } },
                { type: 'badge', props: { props: { text: 'GraphQL' } } },
                { type: 'badge', props: { props: { text: 'AWS' } } }
              ]}
            ]}
          ]
        },
        {
          type: 'section',
          props: { aiContext: 'Work experience section with timeline cards.', layout: { padding: '64' } },
          children: [
            { type: 'heading', props: { props: { text: 'Work Experience', level: 'h2' }, layout: { margin: 'mb-10' } } },
            { type: 'column', props: { layout: { gap: '20' } }, children: [
              { type: 'card', props: { layout: { padding: '28', gap: '16' } }, children: [
                { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                  { type: 'heading', props: { props: { text: 'Senior Frontend Engineer', level: 'h3' } } },
                  { type: 'badge', props: { props: { text: '2022 – Present' } } }
                ]},
                { type: 'text', props: { props: { text: 'TechCorp Inc.', variant: 'muted' } } },
                { type: 'text', props: { props: { text: 'Led migration to Next.js micro-frontend architecture, reducing load time by 40%. Managed a team of 4 engineers.' } } }
              ]},
              { type: 'card', props: { layout: { padding: '28', gap: '16' } }, children: [
                { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                  { type: 'heading', props: { props: { text: 'Frontend Developer', level: 'h3' } } },
                  { type: 'badge', props: { props: { text: '2019 – 2022' } } }
                ]},
                { type: 'text', props: { props: { text: 'StartupXYZ', variant: 'muted' } } },
                { type: 'text', props: { props: { text: 'Built the consumer-facing React application from the ground up, implemented real-time features using WebSockets.' } } }
              ]}
            ]}
          ]
        },
        {
          type: 'section',
          props: { aiContext: 'Selected projects showcase with cards in a row, each with image, badge, title, description, and tech tags.', layout: { padding: '64' }, style: { background: 'bg-surface-raised' } },
          children: [
            { type: 'row', props: { layout: { justify: 'justify-between', align: 'center', margin: 'mb-10' } }, children: [
              { type: 'heading', props: { props: { text: 'Selected Projects', level: 'h2' } } },
              { type: 'button', props: { props: { text: 'View All →', variant: 'ghost' } } }
            ]},
            { type: 'row', props: { layout: { gap: '28' } }, children: [
              { type: 'card', props: { aiContext: 'Project card: SaaS analytics dashboard.', layout: { gap: '0', width: '380' } }, children: [
                { type: 'image', props: { layout: { width: '380', height: '220' }, style: { rounded: 'rounded-t-xl' } } },
                { type: 'column', props: { layout: { padding: '24', gap: '12' } }, children: [
                  { type: 'badge', props: { props: { text: 'SaaS' } } },
                  { type: 'heading', props: { props: { text: 'DevBoard Analytics', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'Real-time developer dashboard with GitHub integration.', variant: 'muted' } } },
                  { type: 'row', props: { layout: { gap: '8' } }, children: [
                    { type: 'tag', props: { props: { text: 'React' } } },
                    { type: 'tag', props: { props: { text: 'TypeScript' } } }
                  ]}
                ]}
              ]},
              { type: 'card', props: { aiContext: 'Project card: E-commerce store with Stripe payments.', layout: { gap: '0', width: '380' } }, children: [
                { type: 'image', props: { layout: { width: '380', height: '220' }, style: { rounded: 'rounded-t-xl' } } },
                { type: 'column', props: { layout: { padding: '24', gap: '12' } }, children: [
                  { type: 'badge', props: { props: { text: 'E-Commerce' } } },
                  { type: 'heading', props: { props: { text: 'ShopMate Store', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'Full-stack store with Stripe payments and inventory management.', variant: 'muted' } } },
                  { type: 'row', props: { layout: { gap: '8' } }, children: [
                    { type: 'tag', props: { props: { text: 'Next.js' } } },
                    { type: 'tag', props: { props: { text: 'Stripe' } } }
                  ]}
                ]}
              ]},
              { type: 'card', props: { aiContext: 'Project card: AI prompt engineering toolkit.', layout: { gap: '0', width: '380' } }, children: [
                { type: 'image', props: { layout: { width: '380', height: '220' }, style: { rounded: 'rounded-t-xl' } } },
                { type: 'column', props: { layout: { padding: '24', gap: '12' } }, children: [
                  { type: 'badge', props: { props: { text: 'AI Tool' } } },
                  { type: 'heading', props: { props: { text: 'PromptKit', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'AI prompt engineering toolkit with version control for developers.', variant: 'muted' } } },
                  { type: 'row', props: { layout: { gap: '8' } }, children: [
                    { type: 'tag', props: { props: { text: 'AI' } } },
                    { type: 'tag', props: { props: { text: 'Node.js' } } }
                  ]}
                ]}
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'hero',
          props: { aiContext: 'Mobile hero: circular photo, badge, name, subtitle, and full-width CTAs stacked.', layout: { padding: '32', gap: '20', align: 'center' } },
          children: [
            { type: 'image', props: { layout: { width: '140', height: '140' }, style: { rounded: 'rounded-full' } } },
            { type: 'badge', props: { props: { text: '👋 Open to Work' } } },
            { type: 'heading', props: { props: { text: 'Alex Johnson', level: 'h1' }, layout: { align: 'center' } } },
            { type: 'text', props: { props: { text: 'Senior Frontend Engineer', variant: 'muted' }, layout: { align: 'center' } } },
            { type: 'button', props: { props: { text: 'View Projects', variant: 'primary', fullWidth: true } } },
            { type: 'button', props: { props: { text: 'Download CV', variant: 'outline', fullWidth: true } } }
          ]
        },
        {
          type: 'section',
          props: { aiContext: 'Mobile tech stack section with wrapped badge pills.', layout: { padding: '24', gap: '16' } },
          children: [
            { type: 'heading', props: { props: { text: 'Tech Stack', level: 'h3' } } },
            { type: 'row', props: { layout: { gap: '8', wrap: 'wrap' } }, children: [
              { type: 'badge', props: { props: { text: 'React' } } },
              { type: 'badge', props: { props: { text: 'TypeScript' } } },
              { type: 'badge', props: { props: { text: 'Next.js' } } },
              { type: 'badge', props: { props: { text: 'Node.js' } } },
              { type: 'badge', props: { props: { text: 'GraphQL' } } }
            ]}
          ]
        },
        {
          type: 'section',
          props: { aiContext: 'Mobile experience section with a single most-recent job card.', layout: { padding: '24', gap: '16' } },
          children: [
            { type: 'heading', props: { props: { text: 'Experience', level: 'h3' } } },
            { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
              { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [
                { type: 'heading', props: { props: { text: 'Senior Frontend Engineer', level: 'h4' } } },
                { type: 'badge', props: { props: { text: '2022–Now' } } }
              ]},
              { type: 'text', props: { props: { text: 'TechCorp Inc.', variant: 'muted' } } },
              { type: 'text', props: { props: { text: 'Led migration to Next.js micro-frontends.' } } }
            ]}
          ]
        },
        {
          type: 'section',
          props: { aiContext: 'Mobile projects section with a featured project card and tech tags.', layout: { padding: '24', gap: '16' } },
          children: [
            { type: 'heading', props: { props: { text: 'Projects', level: 'h3' } } },
            { type: 'card', props: { layout: { gap: '0' } }, children: [
              { type: 'image', props: { layout: { height: '180' }, style: { rounded: 'rounded-t-xl' } } },
              { type: 'column', props: { layout: { padding: '20', gap: '8' } }, children: [
                { type: 'heading', props: { props: { text: 'DevBoard Analytics', level: 'h4' } } },
                { type: 'text', props: { props: { text: 'Real-time developer productivity dashboard.', variant: 'muted' } } },
                { type: 'row', props: { layout: { gap: '8' } }, children: [
                  { type: 'tag', props: { props: { text: 'React' } } },
                  { type: 'tag', props: { props: { text: 'TypeScript' } } }
                ]}
              ]}
            ]}
          ]
        },
        MobileFooter
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'kanban-board',
    name: 'Project Kanban',
    category: 'Dashboards',
    description: 'Agile project management board. Desktop shows columns side-by-side; Mobile uses a stacked/swipeable view.',
    icon: LayoutDashboard,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { aiContext: 'Kanban board with a header toolbar and four status columns side by side.', layout: { padding: '24' } },
          children: [
            { type: 'row', props: { layout: { justify: 'justify-between', align: 'center', margin: 'mb-20' } }, children: [
              { type: 'column', props: { layout: { gap: '4' } }, children: [
                { type: 'heading', props: { props: { text: 'Product Roadmap', level: 'h2' } } },
                { type: 'text', props: { props: { text: 'Q4 2024 Sprint', variant: 'muted' } } }
              ]},
              { type: 'row', props: { layout: { gap: '12' } }, children: [
                { type: 'input', props: { props: { placeholder: 'Search tasks...' } } },
                { type: 'select', props: { props: { placeholder: 'Filter by...' } } },
                { type: 'button', props: { props: { text: 'New Task', variant: 'primary' } } }
              ]}
            ]},
            { type: 'row', props: { aiContext: 'Four Kanban columns: To Do, In Progress, In Review, Done.', layout: { align: 'start', gap: '20' } }, children: [
              { type: 'column', props: { aiContext: 'To Do column with 4 tasks.', layout: { gap: '16', padding: '20', width: '320' }, style: { background: 'bg-surface-raised', rounded: 'rounded-2xl' } }, children: [
                { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                  { type: 'heading', props: { props: { text: 'To Do', level: 'h4' } } },
                  { type: 'badge', props: { props: { text: '4' } } }
                ]},
                { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
                  { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [
                    { type: 'badge', props: { props: { text: 'Design' } } },
                    { type: 'tag', props: { props: { text: 'High' } } }
                  ]},
                  { type: 'heading', props: { props: { text: 'Redesign onboarding flow', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Update the user onboarding with new brand guidelines.', variant: 'muted' } } },
                  { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                    { type: 'row', props: { layout: { gap: '4' } }, children: [
                      { type: 'avatar', props: { layout: { width: '32', height: '32' } } },
                      { type: 'avatar', props: { layout: { width: '32', height: '32' } } }
                    ]},
                    { type: 'progress', props: { props: { label: '30' }, layout: { width: '80' } } }
                  ]}
                ]},
                { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
                  { type: 'badge', props: { props: { text: 'Backend' } } },
                  { type: 'heading', props: { props: { text: 'API rate limiting', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Implement rate limiting for public endpoints.', variant: 'muted' } } }
                ]},
                { type: 'button', props: { props: { text: '+ Add Card', variant: 'ghost', fullWidth: true } } }
              ]},
              { type: 'column', props: { aiContext: 'In Progress column with 2 tasks and progress bars.', layout: { gap: '16', padding: '20', width: '320' }, style: { background: 'bg-surface-raised', rounded: 'rounded-2xl' } }, children: [
                { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                  { type: 'heading', props: { props: { text: 'In Progress', level: 'h4' } } },
                  { type: 'badge', props: { props: { text: '2' } } }
                ]},
                { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
                  { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [
                    { type: 'badge', props: { props: { text: 'Frontend' } } },
                    { type: 'tag', props: { props: { text: 'Medium' } } }
                  ]},
                  { type: 'heading', props: { props: { text: 'Implement auth UI', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Login, register, and password reset screens.', variant: 'muted' } } },
                  { type: 'progress', props: { props: { label: '80' } } }
                ]},
                { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
                  { type: 'badge', props: { props: { text: 'DevOps' } } },
                  { type: 'heading', props: { props: { text: 'CI/CD pipeline setup', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Configure GitHub Actions for staging deploys.', variant: 'muted' } } },
                  { type: 'progress', props: { props: { label: '45' } } }
                ]},
                { type: 'button', props: { props: { text: '+ Add Card', variant: 'ghost', fullWidth: true } } }
              ]},
              { type: 'column', props: { aiContext: 'In Review column with 1 task awaiting QA sign-off.', layout: { gap: '16', padding: '20', width: '320' }, style: { background: 'bg-surface-raised', rounded: 'rounded-2xl' } }, children: [
                { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                  { type: 'heading', props: { props: { text: 'In Review', level: 'h4' } } },
                  { type: 'badge', props: { props: { text: '1' } } }
                ]},
                { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
                  { type: 'badge', props: { props: { text: 'QA' } } },
                  { type: 'heading', props: { props: { text: 'E2E test coverage', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Add Playwright tests for critical user flows.', variant: 'muted' } } }
                ]},
                { type: 'button', props: { props: { text: '+ Add Card', variant: 'ghost', fullWidth: true } } }
              ]},
              { type: 'column', props: { aiContext: 'Done column with 6 completed tasks.', layout: { gap: '16', padding: '20', width: '320' }, style: { background: 'bg-surface-raised', rounded: 'rounded-2xl' } }, children: [
                { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                  { type: 'heading', props: { props: { text: 'Done', level: 'h4' } } },
                  { type: 'badge', props: { props: { text: '6' } } }
                ]},
                { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
                  { type: 'badge', props: { props: { text: 'Design' } } },
                  { type: 'heading', props: { props: { text: 'Component library audit', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Reviewed and documented all UI components.', variant: 'muted' } } }
                ]},
                { type: 'button', props: { props: { text: '+ Add Card', variant: 'ghost', fullWidth: true } } }
              ]}
            ]}
          ]
        }
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'section',
          props: { aiContext: 'Mobile kanban: header with new task button, tabs for column switching, and task cards.', layout: { padding: '16', gap: '16' } },
          children: [
            { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
              { type: 'heading', props: { props: { text: 'Roadmap', level: 'h2' } } },
              { type: 'button', props: { props: { text: 'New Task', variant: 'primary' } } }
            ]},
            { type: 'tabs', props: { props: { text: 'Todo | In Progress | Done' } } },
            { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
              { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [
                { type: 'badge', props: { props: { text: 'Design' } } },
                { type: 'tag', props: { props: { text: 'High' } } }
              ]},
              { type: 'heading', props: { props: { text: 'Redesign onboarding flow', level: 'h4' } } },
              { type: 'text', props: { props: { text: 'Update user onboarding with new brand guidelines.', variant: 'muted' } } },
              { type: 'progress', props: { props: { label: '30' } } }
            ]},
            { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
              { type: 'badge', props: { props: { text: 'Frontend' } } },
              { type: 'heading', props: { props: { text: 'Implement auth UI', level: 'h4' } } },
              { type: 'text', props: { props: { text: 'Login, register, and password reset screens.', variant: 'muted' } } },
              { type: 'progress', props: { props: { label: '80' } } }
            ]},
            { type: 'button', props: { props: { text: '+ Add Task', variant: 'outline', fullWidth: true } } }
          ]
        }
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'social-feed',
    name: 'Social Feed',
    category: 'Social',
    description: 'Modern social media feed. Desktop uses a 3-column layout. Mobile is just the Feed with bottom nav.',
    icon: Newspaper,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'row',
          props: { aiContext: 'Three-column social layout: left nav, center feed, right sidebar. Centered with max width.', layout: { align: 'start', justify: 'justify-center', padding: '32', gap: '32' }, style: { maxWidth: 'max-w-7xl', margin: 'mx-auto' } },
          children: [
            { type: 'column', props: { aiContext: 'Left navigation column with nav list and Post button.', layout: { width: '260', gap: '16' }, style: { position: 'sticky', top: '24px' } }, children: [
              { type: 'list' },
              { type: 'button', props: { props: { text: 'Post', variant: 'primary', fullWidth: true } } }
            ]},
            { type: 'column', props: { aiContext: 'Center feed column: compose box, followed by individual post cards.', layout: { gap: '20', width: '600' } }, children: [
              { type: 'card', props: { aiContext: 'Compose box: avatar + text input, media icons, and Post button.', layout: { padding: '24', gap: '16' } }, children: [
                { type: 'row', props: { layout: { align: 'center', gap: '16' } }, children: [
                  { type: 'image', props: { layout: { width: '48', height: '48' }, style: { rounded: 'rounded-full' } } },
                  { type: 'input', props: { props: { placeholder: "What's on your mind?" } } }
                ]},
                { type: 'divider' },
                { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                  { type: 'row', props: { layout: { gap: '16' } }, children: [
                    { type: 'icon' },
                    { type: 'icon' },
                    { type: 'icon' }
                  ]},
                  { type: 'button', props: { props: { text: 'Post', variant: 'primary' } } }
                ]}
              ]},
              { type: 'card', props: { aiContext: 'Post card 1: author info, text content, attached image, and engagement actions.', layout: { padding: '24', gap: '16' } }, children: [
                { type: 'row', props: { layout: { align: 'center', gap: '12' } }, children: [
                  { type: 'image', props: { layout: { width: '48', height: '48' }, style: { rounded: 'rounded-full' } } },
                  { type: 'column', props: { layout: { gap: '2' } }, children: [
                    { type: 'heading', props: { props: { text: 'Alex Developer', level: 'h4' } } },
                    { type: 'text', props: { props: { text: '@alexdev · 2h', variant: 'muted' } } }
                  ]}
                ]},
                { type: 'text', props: { props: { text: 'Just shipped a major refactor of our API layer. The new architecture is so much cleaner. Loving the TypeScript strict mode! 🚀' } } },
                { type: 'image', props: { layout: { width: '560', height: '320' }, style: { rounded: 'rounded-xl' } } },
                { type: 'divider' },
                { type: 'row', props: { layout: { gap: '24' } }, children: [
                  { type: 'row', props: { layout: { gap: '6', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '48', variant: 'muted' } } }] },
                  { type: 'row', props: { layout: { gap: '6', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '12', variant: 'muted' } } }] },
                  { type: 'row', props: { layout: { gap: '6', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Repost', variant: 'muted' } } }] },
                  { type: 'row', props: { layout: { gap: '6', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Share', variant: 'muted' } } }] }
                ]}
              ]},
              { type: 'card', props: { aiContext: 'Post card 2: author info, text, hashtag tags, and engagement row.', layout: { padding: '24', gap: '16' } }, children: [
                { type: 'row', props: { layout: { align: 'center', gap: '12' } }, children: [
                  { type: 'image', props: { layout: { width: '48', height: '48' }, style: { rounded: 'rounded-full' } } },
                  { type: 'column', props: { layout: { gap: '2' } }, children: [
                    { type: 'heading', props: { props: { text: 'Sarah Design', level: 'h4' } } },
                    { type: 'text', props: { props: { text: '@sarahdesign · 4h', variant: 'muted' } } }
                  ]}
                ]},
                { type: 'text', props: { props: { text: 'New case study dropped! Built a design system from scratch for a fintech startup. Thread below 👇' } } },
                { type: 'row', props: { layout: { gap: '16' } }, children: [
                  { type: 'tag', props: { props: { text: 'DesignSystem' } } },
                  { type: 'tag', props: { props: { text: 'Figma' } } },
                  { type: 'tag', props: { props: { text: 'UX' } } }
                ]},
                { type: 'divider' },
                { type: 'row', props: { layout: { gap: '24' } }, children: [
                  { type: 'row', props: { layout: { gap: '6' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '92', variant: 'muted' } } }] },
                  { type: 'row', props: { layout: { gap: '6' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '31', variant: 'muted' } } }] }
                ]}
              ]}
            ]},
            { type: 'column', props: { aiContext: 'Right sidebar: search input, trending topics card, and who-to-follow card.', layout: { width: '300', gap: '20' }, style: { position: 'sticky', top: '24px' } }, children: [
              { type: 'input', props: { props: { placeholder: 'Search...', type: 'search' } } },
              { type: 'card', props: { layout: { padding: '20', gap: '16' } }, children: [
                { type: 'heading', props: { props: { text: 'Trending', level: 'h3' } } },
                { type: 'column', props: { layout: { gap: '12' } }, children: [
                  { type: 'column', props: { layout: { gap: '2' } }, children: [
                    { type: 'text', props: { props: { text: 'Technology · Trending', variant: 'muted' } } },
                    { type: 'heading', props: { props: { text: '#ReactJS', level: 'h4' } } },
                    { type: 'text', props: { props: { text: '12.4K posts', variant: 'muted' } } }
                  ]},
                  { type: 'divider' },
                  { type: 'column', props: { layout: { gap: '2' } }, children: [
                    { type: 'text', props: { props: { text: 'Design · Trending', variant: 'muted' } } },
                    { type: 'heading', props: { props: { text: '#FigmaConf', level: 'h4' } } },
                    { type: 'text', props: { props: { text: '8.1K posts', variant: 'muted' } } }
                  ]}
                ]}
              ]},
              { type: 'card', props: { aiContext: 'Who to follow card with user avatar, name, handle, and Follow button.', layout: { padding: '20', gap: '16' } }, children: [
                { type: 'heading', props: { props: { text: 'Who to follow', level: 'h3' } } },
                { type: 'row', props: { layout: { align: 'center', justify: 'justify-between' } }, children: [
                  { type: 'row', props: { layout: { gap: '12' } }, children: [
                    { type: 'image', props: { layout: { width: '40', height: '40' }, style: { rounded: 'rounded-full' } } },
                    { type: 'column', children: [
                      { type: 'heading', props: { props: { text: 'Jane Doe', level: 'h4' } } },
                      { type: 'text', props: { props: { text: '@janedoe', variant: 'muted' } } }
                    ]}
                  ]},
                  { type: 'button', props: { props: { text: 'Follow', variant: 'outline' } } }
                ]}
              ]}
            ]}
          ]
        }
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { aiContext: 'Mobile feed: compose card, post cards stacked full-width, followed by bottom nav.', layout: { padding: '0', gap: '0' }, style: { paddingBottom: 'pb-20' } },
          children: [
            { type: 'card', props: { aiContext: 'Mobile compose box: avatar and text input inline.', layout: { padding: '16', gap: '12' }, style: { rounded: 'rounded-none', borderBottom: 'border-b border-border' } }, children: [
              { type: 'row', props: { layout: { align: 'center', gap: '12' } }, children: [
                { type: 'image', props: { layout: { width: '40', height: '40' }, style: { rounded: 'rounded-full' } } },
                { type: 'input', props: { props: { placeholder: "What's on your mind?" } } }
              ]}
            ]},
            { type: 'card', props: { aiContext: 'Mobile post card 1: compact author row, post text, image, action icons.', layout: { padding: '16', gap: '12' }, style: { rounded: 'rounded-none', borderBottom: 'border-b border-border' } }, children: [
              { type: 'row', props: { layout: { align: 'center', gap: '10' } }, children: [
                { type: 'image', props: { layout: { width: '40', height: '40' }, style: { rounded: 'rounded-full' } } },
                { type: 'column', props: { layout: { gap: '1' } }, children: [
                  { type: 'heading', props: { props: { text: 'Alex Developer', level: 'h4' } } },
                  { type: 'text', props: { props: { text: '@alexdev · 2h', variant: 'muted' } } }
                ]}
              ]},
              { type: 'text', props: { props: { text: 'Just shipped a major refactor of our API layer! 🚀' } } },
              { type: 'image', props: { layout: { height: '220' }, style: { rounded: 'rounded-xl' } } },
              { type: 'row', props: { layout: { gap: '20' } }, children: [
                { type: 'icon' },
                { type: 'icon' },
                { type: 'icon' },
                { type: 'icon' }
              ]}
            ]},
            { type: 'card', props: { aiContext: 'Mobile post card 2: compact author row, post text, and hashtag tags.', layout: { padding: '16', gap: '12' }, style: { rounded: 'rounded-none', borderBottom: 'border-b border-border' } }, children: [
              { type: 'row', props: { layout: { align: 'center', gap: '10' } }, children: [
                { type: 'image', props: { layout: { width: '40', height: '40' }, style: { rounded: 'rounded-full' } } },
                { type: 'column', props: { layout: { gap: '1' } }, children: [
                  { type: 'heading', props: { props: { text: 'Sarah Design', level: 'h4' } } },
                  { type: 'text', props: { props: { text: '@sarahdesign · 4h', variant: 'muted' } } }
                ]}
              ]},
              { type: 'text', props: { props: { text: 'New case study: Design system for fintech startup. Thread below 👇' } } },
              { type: 'row', props: { layout: { gap: '8' } }, children: [
                { type: 'tag', props: { props: { text: 'DesignSystem' } } },
                { type: 'tag', props: { props: { text: 'Figma' } } }
              ]}
            ]}
          ]
        },
        { type: 'bottom-nav' }
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'e-commerce',
    name: 'E-Commerce Product',
    category: 'E-Commerce',
    description: 'Detailed product page with image gallery, pricing, and add to cart functionality.',
    icon: ShoppingCart,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { layout: { padding: '24' }, style: { maxWidth: 'max-w-7xl', margin: 'mx-auto' } },
          children: [
            { type: 'breadcrumb', props: { props: { text: 'Home / Shop / Headphones' } } },
            { type: 'row', props: { layout: { gap: '60', align: 'start', margin: 'mt-24' } }, children: [
              { type: 'column', props: { layout: { gap: '20', width: '560' } }, children: [
                { type: 'image', props: { layout: { width: '560', height: '480' }, style: { rounded: 'rounded-2xl' } } },
                { type: 'row', props: { layout: { gap: '16' } }, children: [
                  { type: 'image', props: { layout: { width: '170', height: '100' }, style: { rounded: 'rounded-xl' } } },
                  { type: 'image', props: { layout: { width: '170', height: '100' }, style: { rounded: 'rounded-xl' } } },
                  { type: 'image', props: { layout: { width: '170', height: '100' }, style: { rounded: 'rounded-xl' } } },
                ]}
              ]},
              { type: 'column', props: { layout: { gap: '20' } }, children: [
                { type: 'badge', props: { props: { text: 'New Arrival' } } },
                { type: 'heading', props: { props: { text: 'Premium Wireless Headphones Pro', level: 'h1' } } },
                { type: 'row', props: { layout: { gap: '12', align: 'center' } }, children: [
                  { type: 'rating' },
                  { type: 'text', props: { props: { text: '4.8 (2,341 reviews)', variant: 'muted' } } }
                ]},
                { type: 'row', props: { layout: { align: 'center', gap: '16' } }, children: [
                  { type: 'heading', props: { props: { text: '$299.00', level: 'h2' } } },
                  { type: 'badge', props: { props: { text: 'Save 15%' } } },
                  { type: 'text', props: { props: { text: '$349.00', variant: 'muted' } } }
                ]},
                { type: 'text', props: { props: { text: 'Experience industry-leading noise cancellation, 30-hour battery life, and immersive audio quality engineered for professionals and audiophiles.', variant: 'muted' } } },
                { type: 'divider' },
                { type: 'column', props: { layout: { gap: '12' } }, children: [
                  { type: 'text', props: { props: { text: 'Color' } } },
                  { type: 'row', props: { layout: { gap: '12' } }, children: [
                    { type: 'badge', props: { props: { text: 'Midnight Black' } } },
                    { type: 'badge', props: { props: { text: 'Pearl White' } } },
                    { type: 'badge', props: { props: { text: 'Rose Gold' } } }
                  ]}
                ]},
                { type: 'column', props: { layout: { gap: '12' } }, children: [
                  { type: 'text', props: { props: { text: 'Size / Fit' } } },
                  { type: 'select', props: { props: { placeholder: 'Choose size' } } }
                ]},
                { type: 'row', props: { layout: { gap: '8', align: 'center' } }, children: [
                  { type: 'input', props: { props: { placeholder: 'Qty' }, layout: { width: '80' } } },
                  { type: 'button', props: { props: { text: 'Add to Cart', variant: 'primary', fullWidth: true } } }
                ]},
                { type: 'button', props: { props: { text: 'Buy Now', variant: 'outline', fullWidth: true } } },
                { type: 'row', props: { layout: { gap: '20', align: 'center' } }, children: [
                  { type: 'row', props: { layout: { gap: '8' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Free shipping over $50' } } }] },
                  { type: 'row', props: { layout: { gap: '8' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '30-day returns' } } }] },
                  { type: 'row', props: { layout: { gap: '8' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '2-year warranty' } } }] }
                ]}
              ]}
            ]},
            { type: 'divider', props: { layout: { margin: 'mt-40' } } },
            { type: 'column', props: { layout: { gap: '24', margin: 'mt-32' } }, children: [
              { type: 'tabs', props: { props: { text: 'Description | Specifications | Reviews' } } },
              { type: 'column', props: { layout: { gap: '16' } }, children: [
                { type: 'heading', props: { props: { text: 'Product Details', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'The Premium Wireless Headphones Pro delivers studio-quality sound in a sleek, foldable design. Built with premium materials for all-day comfort.' } } },
                { type: 'row', props: { layout: { gap: '32' } }, children: [
                  { type: 'column', props: { layout: { gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'Driver Size', variant: 'muted' } } }, { type: 'text', props: { props: { text: '40mm Dynamic' } } }] },
                  { type: 'column', props: { layout: { gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'Battery', variant: 'muted' } } }, { type: 'text', props: { props: { text: '30 hours' } } }] },
                  { type: 'column', props: { layout: { gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'Connectivity', variant: 'muted' } } }, { type: 'text', props: { props: { text: 'Bluetooth 5.3' } } }] },
                  { type: 'column', props: { layout: { gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'Weight', variant: 'muted' } } }, { type: 'text', props: { props: { text: '250g' } } }] }
                ]}
              ]}
            ]},
            { type: 'column', props: { layout: { gap: '20', margin: 'mt-40' } }, children: [
              { type: 'heading', props: { props: { text: 'You May Also Like', level: 'h2' } } },
              { type: 'row', props: { layout: { gap: '24' } }, children: [
                { type: 'card', props: { layout: { gap: '0', width: '290' } }, children: [
                  { type: 'image', props: { layout: { width: '290', height: '200' }, style: { rounded: 'rounded-t-xl' } } },
                  { type: 'column', props: { layout: { padding: '16', gap: '8' } }, children: [
                    { type: 'heading', props: { props: { text: 'Studio Monitor Headphones', level: 'h4' } } },
                    { type: 'text', props: { props: { text: '$199' } } },
                    { type: 'rating' }
                  ]}
                ]},
                { type: 'card', props: { layout: { gap: '0', width: '290' } }, children: [
                  { type: 'image', props: { layout: { width: '290', height: '200' }, style: { rounded: 'rounded-t-xl' } } },
                  { type: 'column', props: { layout: { padding: '16', gap: '8' } }, children: [
                    { type: 'heading', props: { props: { text: 'Sport Earbuds Pro', level: 'h4' } } },
                    { type: 'text', props: { props: { text: '$149' } } },
                    { type: 'rating' }
                  ]}
                ]},
                { type: 'card', props: { layout: { gap: '0', width: '290' } }, children: [
                  { type: 'image', props: { layout: { width: '290', height: '200' }, style: { rounded: 'rounded-t-xl' } } },
                  { type: 'column', props: { layout: { padding: '16', gap: '8' } }, children: [
                    { type: 'heading', props: { props: { text: 'Noise Cancel Earphones', level: 'h4' } } },
                    { type: 'text', props: { props: { text: '$249' } } },
                    { type: 'rating' }
                  ]}
                ]},
                { type: 'card', props: { layout: { gap: '0', width: '290' } }, children: [
                  { type: 'image', props: { layout: { width: '290', height: '200' }, style: { rounded: 'rounded-t-xl' } } },
                  { type: 'column', props: { layout: { padding: '16', gap: '8' } }, children: [
                    { type: 'heading', props: { props: { text: 'DJ Mixing Headphones', level: 'h4' } } },
                    { type: 'text', props: { props: { text: '$179' } } },
                    { type: 'rating' }
                  ]}
                ]}
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { layout: { gap: '0' } },
          children: [
            { type: 'image', props: { layout: { height: '320' }, style: { rounded: 'rounded-none' } } },
            { type: 'column', props: { layout: { padding: '20', gap: '16' } }, children: [
              { type: 'badge', props: { props: { text: 'New Arrival' } } },
              { type: 'heading', props: { props: { text: 'Premium Wireless Headphones Pro', level: 'h1' } } },
              { type: 'row', props: { layout: { gap: '8', align: 'center' } }, children: [
                { type: 'rating' },
                { type: 'text', props: { props: { text: '4.8 (2,341)', variant: 'muted' } } }
              ]},
              { type: 'heading', props: { props: { text: '$299.00', level: 'h2' } } },
              { type: 'text', props: { props: { text: 'Industry-leading noise cancellation, 30-hour battery life.', variant: 'muted' } } },
              { type: 'divider' },
              { type: 'select', props: { props: { placeholder: 'Select color' } } },
              { type: 'select', props: { props: { placeholder: 'Choose size' } } },
              { type: 'button', props: { props: { text: 'Add to Cart', variant: 'primary', fullWidth: true } } },
              { type: 'button', props: { props: { text: 'Buy Now', variant: 'outline', fullWidth: true } } },
              { type: 'row', props: { layout: { gap: '16' } }, children: [
                { type: 'icon' },
                { type: 'text', props: { props: { text: 'Free shipping' } } },
                { type: 'icon' },
                { type: 'text', props: { props: { text: '30-day returns' } } }
              ]}
            ]},
            { type: 'section', props: { layout: { padding: '20', gap: '16' }, style: { background: 'bg-surface-raised' } }, children: [
              { type: 'heading', props: { props: { text: 'Reviews', level: 'h3' } } },
              { type: 'rating' },
              { type: 'text', props: { props: { text: '4.8 out of 5 — Based on 2,341 reviews' } } },
              { type: 'card', props: { layout: { padding: '16', gap: '8' } }, children: [
                { type: 'text', props: { props: { text: 'Alex M.', variant: 'muted' } } },
                { type: 'rating' },
                { type: 'text', props: { props: { text: "Best headphones I've ever owned. The noise cancellation is incredible." } } }
              ]}
            ]}
          ]
        },
        MobileFooter
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    category: 'Dashboards',
    description: 'Data-heavy dashboard with metrics cards, charts, and data tables.',
    icon: BarChart,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'row',
          props: { layout: { align: 'start' } },
          children: [
            { type: 'column', props: { layout: { width: '260', padding: '24', gap: '24' } }, children: [
              { type: 'heading', props: { props: { text: 'Dashboard', level: 'h4' } } },
              { type: 'list' },
              { type: 'divider' },
              { type: 'card', props: { layout: { padding: '16', gap: '8' } }, children: [
                { type: 'text', props: { props: { text: 'Storage', variant: 'muted' } } },
                { type: 'progress', props: { props: { label: '60' } } },
                { type: 'text', props: { props: { text: '6.2 GB of 10 GB used', variant: 'muted' } } }
              ]}
            ]},
            { type: 'column', props: { layout: { padding: '32', gap: '28' } }, children: [
              { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                { type: 'column', props: { layout: { gap: '4' } }, children: [
                  { type: 'heading', props: { props: { text: 'Overview', level: 'h2' } } },
                  { type: 'text', props: { props: { text: 'Welcome back, Jane!', variant: 'muted' } } }
                ]},
                { type: 'row', props: { layout: { gap: '12' } }, children: [
                  { type: 'select', props: { props: { placeholder: 'Last 30 days' } } },
                  { type: 'button', props: { props: { text: 'Download Report', variant: 'outline' } } }
                ]}
              ]},
              { type: 'row', props: { layout: { gap: '20' } }, children: [
                { type: 'card', props: { layout: { padding: '24', gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'Total Revenue', variant: 'muted' } } }, { type: 'heading', props: { props: { text: '$48,295', level: 'h3' } } }, { type: 'text', props: { props: { text: '+20.1%', variant: 'muted' } } }] },
                { type: 'card', props: { layout: { padding: '24', gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'New Users', variant: 'muted' } } }, { type: 'heading', props: { props: { text: '+2,350', level: 'h3' } } }, { type: 'text', props: { props: { text: '+180.1%', variant: 'muted' } } }] },
                { type: 'card', props: { layout: { padding: '24', gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'Active Sessions', variant: 'muted' } } }, { type: 'heading', props: { props: { text: '12,234', level: 'h3' } } }, { type: 'text', props: { props: { text: '+19%', variant: 'muted' } } }] },
                { type: 'card', props: { layout: { padding: '24', gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'Conversion Rate', variant: 'muted' } } }, { type: 'heading', props: { props: { text: '3.24%', level: 'h3' } } }, { type: 'text', props: { props: { text: '-0.4%', variant: 'muted' } } }] }
              ]},
              { type: 'row', props: { layout: { gap: '20', align: 'start' } }, children: [
                { type: 'column', props: { layout: { gap: '0' } }, children: [
                  { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [
                    { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                      { type: 'heading', props: { props: { text: 'Revenue Over Time', level: 'h3' } } },
                      { type: 'select', props: { props: { placeholder: 'Monthly' } } }
                    ]},
                    { type: 'chart' }
                  ]}
                ]},
                { type: 'column', props: { layout: { gap: '20', width: '300' } }, children: [
                  { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [
                    { type: 'heading', props: { props: { text: 'Traffic Sources', level: 'h3' } } },
                    { type: 'chart' },
                    { type: 'column', props: { layout: { gap: '8' } }, children: [
                      { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [{ type: 'text', props: { props: { text: 'Organic' } } }, { type: 'text', props: { props: { text: '52%', variant: 'muted' } } }] },
                      { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [{ type: 'text', props: { props: { text: 'Paid' } } }, { type: 'text', props: { props: { text: '28%', variant: 'muted' } } }] },
                      { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [{ type: 'text', props: { props: { text: 'Direct' } } }, { type: 'text', props: { props: { text: '20%', variant: 'muted' } } }] }
                    ]}
                  ]}
                ]}
              ]},
              { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [
                { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                  { type: 'heading', props: { props: { text: 'Recent Transactions', level: 'h3' } } },
                  { type: 'input', props: { props: { placeholder: 'Search...' } } }
                ]},
                { type: 'table' }
              ]},
              { type: 'row', props: { layout: { gap: '20' } }, children: [
                { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [
                  { type: 'heading', props: { props: { text: 'Top Products', level: 'h3' } } },
                  { type: 'list' }
                ]},
                { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [
                  { type: 'heading', props: { props: { text: 'Recent Activity', level: 'h3' } } },
                  { type: 'list' }
                ]}
              ]}
            ]}
          ]
        }
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { layout: { padding: '20', gap: '20' } },
          children: [
            { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
              { type: 'heading', props: { props: { text: 'Overview', level: 'h2' } } },
              { type: 'select', props: { props: { placeholder: 'This month' } } }
            ]},
            { type: 'row', props: { layout: { gap: '12' } }, children: [
              { type: 'card', props: { layout: { padding: '20', gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'Revenue', variant: 'muted' } } }, { type: 'heading', props: { props: { text: '$48.2K', level: 'h3' } } }, { type: 'text', props: { props: { text: '+20%', variant: 'muted' } } }] },
              { type: 'card', props: { layout: { padding: '20', gap: '8' } }, children: [{ type: 'text', props: { props: { text: 'Users', variant: 'muted' } } }, { type: 'heading', props: { props: { text: '2,350', level: 'h3' } } }, { type: 'text', props: { props: { text: '+180%', variant: 'muted' } } }] }
            ]},
            { type: 'card', props: { layout: { padding: '20', gap: '16' } }, children: [
              { type: 'heading', props: { props: { text: 'Revenue', level: 'h3' } } },
              { type: 'chart' }
            ]},
            { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
              { type: 'heading', props: { props: { text: 'Recent Transactions', level: 'h3' } } },
              { type: 'column', props: { layout: { gap: '12' } }, children: [
                { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [{ type: 'text', props: { props: { text: 'Invoice #4521' } } }, { type: 'text', props: { props: { text: '$340.00' } } }] },
                { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [{ type: 'text', props: { props: { text: 'Invoice #4520' } } }, { type: 'text', props: { props: { text: '$125.00' } } }] },
                { type: 'row', props: { layout: { justify: 'justify-between' } }, children: [{ type: 'text', props: { props: { text: 'Invoice #4519' } } }, { type: 'text', props: { props: { text: '$890.00' } } }] }
              ]}
            ]},
            { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
              { type: 'heading', props: { props: { text: 'Top Products', level: 'h3' } } },
              { type: 'list' }
            ]}
          ]
        }
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'blog-post',
    name: 'Blog Article',
    category: 'Content',
    description: 'Clean reading experience with a large hero image, typography optimized for reading, and author bio.',
    icon: FileText,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'column',
          props: { layout: { align: 'center', padding: '64', gap: '0' }, style: { maxWidth: 'max-w-3xl', margin: 'mx-auto' } },
          children: [
            { type: 'column', props: { layout: { align: 'center', gap: '20', margin: 'mb-40' } }, children: [
              { type: 'badge', props: { props: { text: 'Engineering' } } },
              { type: 'heading', props: { props: { text: 'The Future of Web Development in 2025', level: 'h1' } } },
              { type: 'text', props: { props: { text: 'An in-depth look at the trends reshaping how we build, deploy, and scale modern applications.', variant: 'muted' } } },
              { type: 'row', props: { layout: { align: 'center', gap: '16', margin: 'mt-8' } }, children: [
                { type: 'image', props: { layout: { width: '48', height: '48' }, style: { rounded: 'rounded-full' } } },
                { type: 'column', props: { layout: { gap: '2' } }, children: [
                  { type: 'heading', props: { props: { text: 'Jane Doe', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'October 12, 2024 · 8 min read', variant: 'muted' } } }
                ]}
              ]},
              { type: 'row', props: { layout: { gap: '8' } }, children: [
                { type: 'tag', props: { props: { text: 'Web Dev' } } },
                { type: 'tag', props: { props: { text: 'AI' } } },
                { type: 'tag', props: { props: { text: 'Performance' } } },
                { type: 'tag', props: { props: { text: 'Architecture' } } }
              ]}
            ]},
            { type: 'image', props: { layout: { height: '420' }, style: { rounded: 'rounded-2xl' } } },
            { type: 'column', props: { layout: { gap: '32', margin: 'mt-48' } }, children: [
              { type: 'text', props: { props: { text: 'Web development is evolving at a breakneck pace. As we look toward 2025, several transformative trends are redefining how we think about the stack, the workflow, and the developer experience.' } } },
              { type: 'heading', props: { props: { text: '1. AI-Assisted Development', level: 'h2' } } },
              { type: 'text', props: { props: { text: "Artificial intelligence is no longer just a productivity booster—it's becoming a core part of the stack. From Copilot-style completions to full agentic coding workflows, AI is changing what it means to write software." } } },
              { type: 'alert' },
              { type: 'heading', props: { props: { text: '2. Edge-First Architecture', level: 'h2' } } },
              { type: 'text', props: { props: { text: "Running compute closer to users isn't new, but in 2025, edge-first thinking shapes initial architecture decisions. Frameworks like Next.js, Remix, and SvelteKit make edge deployments a first-class option." } } },
              { type: 'heading', props: { props: { text: '3. Component-Driven Design Systems', level: 'h2' } } },
              { type: 'text', props: { props: { text: 'Design systems are maturing. The gap between design tools and code is shrinking with tools that generate production-ready components directly from Figma specs.' } } },
              { type: 'divider' },
              { type: 'card', props: { layout: { padding: '32', gap: '20' } }, children: [
                { type: 'row', props: { layout: { align: 'center', gap: '20' } }, children: [
                  { type: 'image', props: { layout: { width: '80', height: '80' }, style: { rounded: 'rounded-full' } } },
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'heading', props: { props: { text: 'Jane Doe', level: 'h3' } } },
                    { type: 'text', props: { props: { text: 'Senior Engineer at TechCorp. Writing about web performance, DX, and the future of software development.' } } },
                    { type: 'row', props: { layout: { gap: '12' } }, children: [
                      { type: 'button', props: { props: { text: 'Follow', variant: 'outline' } } },
                      { type: 'button', props: { props: { text: 'More Articles', variant: 'ghost' } } }
                    ]}
                  ]}
                ]}
              ]}
            ]},
            { type: 'section', props: { layout: { padding: '0', gap: '24', margin: 'mt-48' } }, children: [
              { type: 'heading', props: { props: { text: 'Related Articles', level: 'h2' } } },
              { type: 'row', props: { layout: { gap: '24' } }, children: [
                { type: 'card', props: { layout: { gap: '0', width: '340' } }, children: [
                  { type: 'image', props: { layout: { width: '340', height: '200' }, style: { rounded: 'rounded-t-xl' } } },
                  { type: 'column', props: { layout: { padding: '20', gap: '8' } }, children: [
                    { type: 'badge', props: { props: { text: 'Performance' } } },
                    { type: 'heading', props: { props: { text: 'Core Web Vitals in 2025', level: 'h3' } } },
                    { type: 'text', props: { props: { text: 'Oct 8, 2024', variant: 'muted' } } }
                  ]}
                ]},
                { type: 'card', props: { layout: { gap: '0', width: '340' } }, children: [
                  { type: 'image', props: { layout: { width: '340', height: '200' }, style: { rounded: 'rounded-t-xl' } } },
                  { type: 'column', props: { layout: { padding: '20', gap: '8' } }, children: [
                    { type: 'badge', props: { props: { text: 'AI' } } },
                    { type: 'heading', props: { props: { text: 'Building with AI Agents', level: 'h3' } } },
                    { type: 'text', props: { props: { text: 'Oct 1, 2024', variant: 'muted' } } }
                  ]}
                ]},
                { type: 'card', props: { layout: { gap: '0', width: '340' } }, children: [
                  { type: 'image', props: { layout: { width: '340', height: '200' }, style: { rounded: 'rounded-t-xl' } } },
                  { type: 'column', props: { layout: { padding: '20', gap: '8' } }, children: [
                    { type: 'badge', props: { props: { text: 'Architecture' } } },
                    { type: 'heading', props: { props: { text: 'Micro-frontends Revisited', level: 'h3' } } },
                    { type: 'text', props: { props: { text: 'Sep 24, 2024', variant: 'muted' } } }
                  ]}
                ]}
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { layout: { padding: '20', gap: '20' } },
          children: [
            { type: 'badge', props: { props: { text: 'Engineering' } } },
            { type: 'heading', props: { props: { text: 'The Future of Web Dev in 2025', level: 'h1' } } },
            { type: 'row', props: { layout: { align: 'center', gap: '12' } }, children: [
              { type: 'image', props: { layout: { width: '40', height: '40' }, style: { rounded: 'rounded-full' } } },
              { type: 'column', props: { layout: { gap: '2' } }, children: [
                { type: 'heading', props: { props: { text: 'Jane Doe', level: 'h4' } } },
                { type: 'text', props: { props: { text: 'Oct 12 · 8 min read', variant: 'muted' } } }
              ]}
            ]},
            { type: 'image', props: { layout: { height: '220' }, style: { rounded: 'rounded-xl' } } },
            { type: 'text', props: { props: { text: 'Web development is evolving at a breakneck pace. Several trends are redefining the stack.' } } },
            { type: 'heading', props: { props: { text: '1. AI-Assisted Development', level: 'h2' } } },
            { type: 'text', props: { props: { text: 'From Copilot to full agentic workflows, AI is changing what it means to write software.' } } },
            { type: 'alert' },
            { type: 'heading', props: { props: { text: '2. Edge-First Architecture', level: 'h2' } } },
            { type: 'text', props: { props: { text: 'Running compute closer to users reshapes initial architecture decisions.' } } },
            { type: 'divider' },
            { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
              { type: 'row', props: { layout: { align: 'center', gap: '12' } }, children: [
                { type: 'image', props: { layout: { width: '56', height: '56' }, style: { rounded: 'rounded-full' } } },
                { type: 'column', props: { layout: { gap: '4' } }, children: [
                  { type: 'heading', props: { props: { text: 'Jane Doe', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Senior Engineer at TechCorp', variant: 'muted' } } }
                ]}
              ]},
              { type: 'button', props: { props: { text: 'Follow', variant: 'outline', fullWidth: true } } }
            ]},
            { type: 'heading', props: { props: { text: 'Related Articles', level: 'h3' } } },
            { type: 'card', props: { layout: { gap: '0' } }, children: [
              { type: 'image', props: { layout: { height: '180' }, style: { rounded: 'rounded-t-xl' } } },
              { type: 'column', props: { layout: { padding: '16', gap: '8' } }, children: [
                { type: 'badge', props: { props: { text: 'Performance' } } },
                { type: 'heading', props: { props: { text: 'Core Web Vitals in 2025', level: 'h4' } } },
                { type: 'text', props: { props: { text: 'Oct 8, 2024', variant: 'muted' } } }
              ]}
            ]}
          ]
        },
        MobileFooter
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'pricing',
    name: 'Pricing Plans',
    category: 'Landing Pages',
    description: 'Three-tier pricing layout with a highlighted popular plan.',
    icon: CreditCard,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { aiContext: 'Pricing hero: badge, headline, billing toggle, three-tier plan cards, FAQ teaser.', layout: { align: 'center', padding: '80', gap: '48' } },
          children: [
            { type: 'column', props: { layout: { align: 'center', gap: '20' } }, children: [
              { type: 'badge', props: { props: { text: 'Simple Pricing' } } },
              { type: 'heading', props: { props: { text: 'Plans for every team', level: 'h1' } } },
              { type: 'text', props: { props: { text: 'Start free, scale as you grow. No hidden fees, no surprises.', variant: 'muted' } } },
              { type: 'row', props: { layout: { gap: '12', align: 'center' } }, children: [
                { type: 'text', props: { props: { text: 'Monthly', variant: 'muted' } } },
                { type: 'toggle', props: { props: { label: 'Annual billing' } } },
                { type: 'badge', props: { props: { text: 'Save 20%' } } }
              ]}
            ]},
            { type: 'row', props: { layout: { justify: 'justify-center', align: 'end', gap: '24' } }, children: [
              { type: 'card', props: { aiContext: 'Starter plan card.', layout: { padding: '40', gap: '24', width: '340' } }, children: [
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'heading', props: { props: { text: 'Starter', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'For individuals and small projects', variant: 'muted' } } }
                ]},
                { type: 'row', props: { layout: { align: 'end', gap: '4' } }, children: [
                  { type: 'heading', props: { props: { text: '$9', level: 'h1' } } },
                  { type: 'text', props: { props: { text: '/month', variant: 'muted' } } }
                ]},
                { type: 'divider' },
                { type: 'column', props: { layout: { gap: '12' } }, children: [
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Up to 3 projects' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '5 GB storage' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Email support' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Basic analytics' } } }] }
                ]},
                { type: 'button', props: { props: { text: 'Get Started Free', variant: 'outline', fullWidth: true } } }
              ]},
              { type: 'card', props: { aiContext: 'Pro plan card (most popular, highlighted border).', layout: { padding: '40', gap: '24', width: '340' }, style: { border: 'border-2 border-primary' } }, children: [
                { type: 'badge', props: { props: { text: 'Most Popular' } } },
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'heading', props: { props: { text: 'Pro', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'For growing teams and businesses', variant: 'muted' } } }
                ]},
                { type: 'row', props: { layout: { align: 'end', gap: '4' } }, children: [
                  { type: 'heading', props: { props: { text: '$29', level: 'h1' } } },
                  { type: 'text', props: { props: { text: '/month', variant: 'muted' } } }
                ]},
                { type: 'divider' },
                { type: 'column', props: { layout: { gap: '12' } }, children: [
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Unlimited projects' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '50 GB storage' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Priority support' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Advanced analytics' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Custom domains' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Team collaboration' } } }] }
                ]},
                { type: 'button', props: { props: { text: 'Start Pro Trial', variant: 'primary', fullWidth: true } } },
                { type: 'text', props: { props: { text: '14-day free trial, no card required', variant: 'muted' } } }
              ]},
              { type: 'card', props: { aiContext: 'Enterprise plan card.', layout: { padding: '40', gap: '24', width: '340' } }, children: [
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'heading', props: { props: { text: 'Enterprise', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'For large organizations', variant: 'muted' } } }
                ]},
                { type: 'row', props: { layout: { align: 'end', gap: '4' } }, children: [
                  { type: 'heading', props: { props: { text: '$99', level: 'h1' } } },
                  { type: 'text', props: { props: { text: '/month', variant: 'muted' } } }
                ]},
                { type: 'divider' },
                { type: 'column', props: { layout: { gap: '12' } }, children: [
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Unlimited everything' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '500 GB storage' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Dedicated support' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Custom integrations' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'SSO / SAML' } } }] },
                  { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'SLA guarantee' } } }] }
                ]},
                { type: 'button', props: { props: { text: 'Contact Sales', variant: 'outline', fullWidth: true } } }
              ]}
            ]},
            { type: 'card', props: { aiContext: 'FAQ teaser card with three common questions.', layout: { padding: '32', gap: '20' } }, children: [
              { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'heading', props: { props: { text: 'Frequently asked', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'Quick answers to common pricing questions.', variant: 'muted' } } }
                ]},
                { type: 'button', props: { props: { text: 'View full FAQ', variant: 'ghost' } } }
              ]},
              { type: 'row', props: { layout: { gap: '24' } }, children: [
                { type: 'column', props: { layout: { gap: '8', width: '380' } }, children: [
                  { type: 'heading', props: { props: { text: 'Can I change plans?', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Yes, upgrade or downgrade at any time. Changes apply at next billing cycle.', variant: 'muted' } } }
                ]},
                { type: 'column', props: { layout: { gap: '8', width: '380' } }, children: [
                  { type: 'heading', props: { props: { text: 'Is there a free trial?', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Pro plan includes a 14-day free trial. No credit card required to start.', variant: 'muted' } } }
                ]},
                { type: 'column', props: { layout: { gap: '8', width: '380' } }, children: [
                  { type: 'heading', props: { props: { text: 'What payment methods?', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'We accept all major credit cards, PayPal, and wire transfer for Enterprise.', variant: 'muted' } } }
                ]}
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { aiContext: 'Mobile pricing: badge, headline, three plan cards stacked, footer.', layout: { padding: '24', gap: '24', align: 'center' } },
          children: [
            { type: 'badge', props: { props: { text: 'Simple Pricing' } } },
            { type: 'heading', props: { props: { text: 'Plans for every team', level: 'h1' } } },
            { type: 'text', props: { props: { text: 'Start free, scale as you grow.', variant: 'muted' } } },
            { type: 'card', props: { layout: { padding: '28', gap: '20' } }, children: [
              { type: 'heading', props: { props: { text: 'Starter', level: 'h3' } } },
              { type: 'row', props: { layout: { align: 'end', gap: '4' } }, children: [
                { type: 'heading', props: { props: { text: '$9', level: 'h1' } } },
                { type: 'text', props: { props: { text: '/month', variant: 'muted' } } }
              ]},
              { type: 'column', props: { layout: { gap: '10' } }, children: [
                { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '3 projects' } } }] },
                { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '5 GB' } } }] },
                { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Email support' } } }] }
              ]},
              { type: 'button', props: { props: { text: 'Get Started', variant: 'outline', fullWidth: true } } }
            ]},
            { type: 'card', props: { layout: { padding: '28', gap: '20' }, style: { border: 'border border-primary' } }, children: [
              { type: 'badge', props: { props: { text: 'Most Popular' } } },
              { type: 'heading', props: { props: { text: 'Pro', level: 'h3' } } },
              { type: 'row', props: { layout: { align: 'end', gap: '4' } }, children: [
                { type: 'heading', props: { props: { text: '$29', level: 'h1' } } },
                { type: 'text', props: { props: { text: '/month', variant: 'muted' } } }
              ]},
              { type: 'column', props: { layout: { gap: '10' } }, children: [
                { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Unlimited projects' } } }] },
                { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: '50 GB' } } }] },
                { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Priority support' } } }] },
                { type: 'row', props: { layout: { gap: '10', align: 'center' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'Team collab' } } }] }
              ]},
              { type: 'button', props: { props: { text: 'Start Pro Trial', variant: 'primary', fullWidth: true } } }
            ]},
            { type: 'card', props: { layout: { padding: '28', gap: '20' } }, children: [
              { type: 'heading', props: { props: { text: 'Enterprise', level: 'h3' } } },
              { type: 'row', props: { layout: { align: 'end', gap: '4' } }, children: [
                { type: 'heading', props: { props: { text: '$99', level: 'h1' } } },
                { type: 'text', props: { props: { text: '/month', variant: 'muted' } } }
              ]},
              { type: 'button', props: { props: { text: 'Contact Sales', variant: 'outline', fullWidth: true } } }
            ]}
          ]
        },
        MobileFooter
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'auth-login',
    name: 'Login & Authentication',
    category: 'Forms',
    description: 'Clean, centered authentication card with social login buttons.',
    icon: Lock,
    build: () => {
      const desktopNodes: NodeDef[] = [
        {
          type: 'section',
          props: { aiContext: 'Full-screen split login: left promo column with testimonial, right form column.', layout: { align: 'center', justify: 'justify-center' }, style: { minHeight: 'min-h-screen' } },
          children: [
            { type: 'row', props: { layout: { align: 'stretch' } }, children: [
              { type: 'column', props: { aiContext: 'Left promo panel: headline, value props with icons, testimonial card.', layout: { width: '560', padding: '80', gap: '48' }, style: { background: 'bg-surface-raised' } }, children: [
                { type: 'column', props: { layout: { gap: '32' } }, children: [
                  { type: 'heading', props: { props: { text: 'Welcome to AppName', level: 'h2' } } },
                  { type: 'text', props: { props: { text: 'Join thousands of teams building better products, faster. Start your free trial today.', variant: 'muted' } } },
                  { type: 'column', props: { layout: { gap: '16' } }, children: [
                    { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                      { type: 'icon' },
                      { type: 'column', props: {}, children: [
                        { type: 'heading', props: { props: { text: '30-day free trial', level: 'h4' } } },
                        { type: 'text', props: { props: { text: 'No credit card required', variant: 'muted' } } }
                      ]}
                    ]},
                    { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                      { type: 'icon' },
                      { type: 'column', props: {}, children: [
                        { type: 'heading', props: { props: { text: 'Enterprise security', level: 'h4' } } },
                        { type: 'text', props: { props: { text: 'SOC2 Type II certified', variant: 'muted' } } }
                      ]}
                    ]},
                    { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                      { type: 'icon' },
                      { type: 'column', props: {}, children: [
                        { type: 'heading', props: { props: { text: 'World-class support', level: 'h4' } } },
                        { type: 'text', props: { props: { text: 'Response time under 2 hours', variant: 'muted' } } }
                      ]}
                    ]}
                  ]}
                ]},
                { type: 'card', props: { aiContext: 'Testimonial quote card.', layout: { padding: '24', gap: '16' } }, children: [
                  { type: 'text', props: { props: { text: '"This product transformed how our team collaborates. We ship 3x faster now."' } } },
                  { type: 'row', props: { layout: { gap: '12', align: 'center' } }, children: [
                    { type: 'image', props: { layout: { width: '40', height: '40' }, style: { rounded: 'rounded-full' } } },
                    { type: 'column', props: {}, children: [
                      { type: 'heading', props: { props: { text: 'Sarah Connor', level: 'h4' } } },
                      { type: 'text', props: { props: { text: 'CTO at TechCorp', variant: 'muted' } } }
                    ]}
                  ]}
                ]}
              ]},
              { type: 'column', props: { aiContext: 'Right login form: heading, email + password inputs, divider, social logins.', layout: { padding: '80', gap: '32', align: 'center', justify: 'justify-center' } }, children: [
                { type: 'column', props: { layout: { gap: '8', align: 'center' } }, children: [
                  { type: 'heading', props: { props: { text: 'Sign in', level: 'h2' } } },
                  { type: 'text', props: { props: { text: 'New here? Create an account', variant: 'muted' } } }
                ]},
                { type: 'column', props: { layout: { gap: '20' } }, children: [
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'Email' } } },
                    { type: 'input', props: { props: { placeholder: 'you@company.com', type: 'email' } } }
                  ]},
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'Password' } } },
                    { type: 'input', props: { props: { placeholder: '••••••••', type: 'password' } } }
                  ]},
                  { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                    { type: 'text', props: { props: { text: 'Remember me' } } },
                    { type: 'link', props: { props: { text: 'Forgot password?' } } }
                  ]},
                  { type: 'button', props: { props: { text: 'Sign In', variant: 'primary', fullWidth: true } } }
                ]},
                { type: 'row', props: { layout: { align: 'center', gap: '12' } }, children: [
                  { type: 'divider' },
                  { type: 'text', props: { props: { text: 'OR', variant: 'muted' } } },
                  { type: 'divider' }
                ]},
                { type: 'column', props: { layout: { gap: '12' } }, children: [
                  { type: 'button', props: { props: { text: 'Continue with Google', variant: 'outline', fullWidth: true } } },
                  { type: 'button', props: { props: { text: 'Continue with GitHub', variant: 'outline', fullWidth: true } } }
                ]}
              ]}
            ]}
          ]
        }
      ];

      const mobileNodes: NodeDef[] = [
        {
          type: 'column',
          props: { aiContext: 'Mobile login: heading, inputs, social login buttons, sign-up link.', layout: { padding: '32', gap: '28', justify: 'justify-center' }, style: { minHeight: 'min-h-screen' } },
          children: [
            { type: 'column', props: { layout: { gap: '8' } }, children: [
              { type: 'heading', props: { props: { text: 'Sign in', level: 'h2' } } },
              { type: 'text', props: { props: { text: 'Welcome back! Please sign in to continue.', variant: 'muted' } } }
            ]},
            { type: 'column', props: { layout: { gap: '16' } }, children: [
              { type: 'input', props: { props: { placeholder: 'Email address', type: 'email' } } },
              { type: 'input', props: { props: { placeholder: 'Password', type: 'password' } } },
              { type: 'button', props: { props: { text: 'Sign In', variant: 'primary', fullWidth: true } } }
            ]},
            { type: 'row', props: { layout: { align: 'center', gap: '8' } }, children: [
              { type: 'divider' },
              { type: 'text', props: { props: { text: 'OR', variant: 'muted' } } },
              { type: 'divider' }
            ]},
            { type: 'button', props: { props: { text: 'Continue with Google', variant: 'outline', fullWidth: true } } },
            { type: 'button', props: { props: { text: 'Continue with GitHub', variant: 'outline', fullWidth: true } } },
            { type: 'text', props: { props: { text: "Don't have an account? Sign up", variant: 'muted' } } }
          ]
        }
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'user-settings',
    name: 'Settings Page',
    category: 'Dashboards',
    description: 'Dashboard settings with a left navigation sidebar and a right content area.',
    icon: Settings,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'row',
          props: { aiContext: 'Settings page: left sidebar nav, right multi-card content area.', layout: { align: 'start', padding: '48', gap: '48' } },
          children: [
            { type: 'column', props: { aiContext: 'Settings sidebar navigation.', layout: { width: '240', gap: '4' } }, children: [
              { type: 'heading', props: { props: { text: 'Settings', level: 'h4' } } },
              { type: 'button', props: { props: { text: 'Profile', variant: 'secondary', fullWidth: true } } },
              { type: 'button', props: { props: { text: 'Account', variant: 'ghost', fullWidth: true } } },
              { type: 'button', props: { props: { text: 'Notifications', variant: 'ghost', fullWidth: true } } },
              { type: 'button', props: { props: { text: 'Appearance', variant: 'ghost', fullWidth: true } } },
              { type: 'button', props: { props: { text: 'Security', variant: 'ghost', fullWidth: true } } },
              { type: 'button', props: { props: { text: 'Billing', variant: 'ghost', fullWidth: true } } },
              { type: 'button', props: { props: { text: 'Integrations', variant: 'ghost', fullWidth: true } } },
              { type: 'divider' },
              { type: 'button', props: { props: { text: 'Log out', variant: 'ghost', fullWidth: true } } }
            ]},
            { type: 'column', props: { aiContext: 'Settings content area: avatar card, personal info card, notifications card, danger zone card.', layout: { gap: '32' } }, children: [
              { type: 'heading', props: { props: { text: 'Profile Settings', level: 'h2' } } },
              { type: 'divider' },
              { type: 'card', props: { aiContext: 'Profile photo upload card.', layout: { padding: '32', gap: '24' } }, children: [
                { type: 'heading', props: { props: { text: 'Profile Photo', level: 'h4' } } },
                { type: 'row', props: { layout: { gap: '20', align: 'center' } }, children: [
                  { type: 'image', props: { layout: { width: '80', height: '80' }, style: { rounded: 'rounded-full' } } },
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'JPG, PNG or GIF, max 2MB', variant: 'muted' } } },
                    { type: 'row', props: { layout: { gap: '12' } }, children: [
                      { type: 'button', props: { props: { text: 'Upload Photo', variant: 'outline' } } },
                      { type: 'button', props: { props: { text: 'Remove', variant: 'ghost' } } }
                    ]}
                  ]}
                ]}
              ]},
              { type: 'card', props: { aiContext: 'Personal information form card.', layout: { padding: '32', gap: '24' } }, children: [
                { type: 'heading', props: { props: { text: 'Personal Information', level: 'h4' } } },
                { type: 'row', props: { layout: { gap: '20' } }, children: [
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'First Name' } } },
                    { type: 'input', props: { props: { placeholder: 'Jane' } } }
                  ]},
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'Last Name' } } },
                    { type: 'input', props: { props: { placeholder: 'Doe' } } }
                  ]}
                ]},
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'Email' } } },
                  { type: 'input', props: { props: { placeholder: 'jane@example.com', type: 'email' } } }
                ]},
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'Bio' } } },
                  { type: 'textarea', props: { props: { placeholder: 'Tell us about yourself...' } } }
                ]},
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'Website' } } },
                  { type: 'input', props: { props: { placeholder: 'https://yoursite.com' } } }
                ]},
                { type: 'row', props: { layout: { justify: 'justify-end' } }, children: [
                  { type: 'button', props: { props: { text: 'Save Changes', variant: 'primary' } } }
                ]}
              ]},
              { type: 'card', props: { aiContext: 'Notification preferences card with toggles.', layout: { padding: '32', gap: '24' } }, children: [
                { type: 'heading', props: { props: { text: 'Notification Preferences', level: 'h4' } } },
                { type: 'column', props: { layout: { gap: '16' } }, children: [
                  { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                    { type: 'column', props: {}, children: [
                      { type: 'heading', props: { props: { text: 'Email notifications', level: 'h4' } } },
                      { type: 'text', props: { props: { text: 'Receive updates via email', variant: 'muted' } } }
                    ]},
                    { type: 'toggle', props: { props: { label: '' } } }
                  ]},
                  { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                    { type: 'column', props: {}, children: [
                      { type: 'heading', props: { props: { text: 'Push notifications', level: 'h4' } } },
                      { type: 'text', props: { props: { text: 'Browser push alerts', variant: 'muted' } } }
                    ]},
                    { type: 'toggle', props: { props: { label: '' } } }
                  ]},
                  { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                    { type: 'column', props: {}, children: [
                      { type: 'heading', props: { props: { text: 'Marketing emails', level: 'h4' } } },
                      { type: 'text', props: { props: { text: 'Product news and tips', variant: 'muted' } } }
                    ]},
                    { type: 'toggle', props: { props: { label: '' } } }
                  ]}
                ]},
                { type: 'row', props: { layout: { justify: 'justify-end' } }, children: [
                  { type: 'button', props: { props: { text: 'Save Preferences', variant: 'primary' } } }
                ]}
              ]},
              { type: 'card', props: { aiContext: 'Danger zone card with delete account action.', layout: { padding: '32', gap: '24' } }, children: [
                { type: 'heading', props: { props: { text: 'Danger Zone', level: 'h4' } } },
                { type: 'alert', props: { props: { text: 'These actions are irreversible. Please proceed with caution.' } } },
                { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                  { type: 'column', props: { layout: { gap: '4' } }, children: [
                    { type: 'heading', props: { props: { text: 'Delete Account', level: 'h4' } } },
                    { type: 'text', props: { props: { text: 'Permanently remove your account and all data.', variant: 'muted' } } }
                  ]},
                  { type: 'button', props: { props: { text: 'Delete Account', variant: 'destructive' } } }
                ]}
              ]}
            ]}
          ]
        }
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { aiContext: 'Mobile settings: heading, tabs, profile card, notifications card, log out.', layout: { padding: '20', gap: '20' } },
          children: [
            { type: 'heading', props: { props: { text: 'Settings', level: 'h2' } } },
            { type: 'tabs', props: { props: { text: 'Profile | Account | Notifs | Security' } } },
            { type: 'card', props: { aiContext: 'Mobile profile card with avatar and form fields.', layout: { padding: '20', gap: '20' } }, children: [
              { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                { type: 'image', props: { layout: { width: '64', height: '64' }, style: { rounded: 'rounded-full' } } },
                { type: 'column', props: { layout: { gap: '4' } }, children: [
                  { type: 'heading', props: { props: { text: 'Jane Doe', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'jane@example.com', variant: 'muted' } } },
                  { type: 'button', props: { props: { text: 'Change Photo', variant: 'ghost' } } }
                ]}
              ]},
              { type: 'divider' },
              { type: 'column', props: { layout: { gap: '16' } }, children: [
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'First Name' } } },
                  { type: 'input', props: { props: { placeholder: 'Jane' } } }
                ]},
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'Last Name' } } },
                  { type: 'input', props: { props: { placeholder: 'Doe' } } }
                ]},
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'Email' } } },
                  { type: 'input', props: { props: { placeholder: 'jane@example.com' } } }
                ]},
                { type: 'button', props: { props: { text: 'Save Changes', variant: 'primary', fullWidth: true } } }
              ]}
            ]},
            { type: 'card', props: { aiContext: 'Mobile notifications toggles card.', layout: { padding: '20', gap: '16' } }, children: [
              { type: 'heading', props: { props: { text: 'Notifications', level: 'h4' } } },
              { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                { type: 'text', props: { props: { text: 'Email updates' } } },
                { type: 'toggle', props: { props: { label: '' } } }
              ]},
              { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                { type: 'text', props: { props: { text: 'Push alerts' } } },
                { type: 'toggle', props: { props: { label: '' } } }
              ]},
              { type: 'row', props: { layout: { justify: 'justify-between', align: 'center' } }, children: [
                { type: 'text', props: { props: { text: 'Marketing' } } },
                { type: 'toggle', props: { props: { label: '' } } }
              ]}
            ]},
            { type: 'button', props: { props: { text: 'Log Out', variant: 'ghost', fullWidth: true } } }
          ]
        }
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'user-profile',
    name: 'User Profile',
    category: 'Social',
    description: 'Header with cover photo, avatar, and user details, followed by content tabs.',
    icon: User,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'column',
          props: { aiContext: 'User profile: cover photo, profile header row, two-column body with sidebar and main feed.', layout: { gap: '0' } },
          children: [
            { type: 'image', props: { aiContext: 'Cover photo banner.', layout: { height: '280' }, style: { rounded: 'rounded-none' } } },
            { type: 'row', props: { aiContext: 'Profile header: avatar + name/tags on left, action buttons on right.', layout: { justify: 'justify-between', align: 'end', padding: '48' } }, children: [
              { type: 'row', props: { layout: { gap: '20', align: 'end' } }, children: [
                { type: 'image', props: { layout: { width: '128', height: '128' }, style: { rounded: 'rounded-full', border: 'border-4 border-background' } } },
                { type: 'column', props: { layout: { gap: '4', padding: '16' } }, children: [
                  { type: 'heading', props: { props: { text: 'Sarah Connor', level: 'h2' } } },
                  { type: 'text', props: { props: { text: 'Product Designer at DesignCo', variant: 'muted' } } },
                  { type: 'row', props: { layout: { gap: '8' } }, children: [
                    { type: 'tag', props: { props: { text: 'UI/UX' } } },
                    { type: 'tag', props: { props: { text: 'Figma' } } },
                    { type: 'tag', props: { props: { text: 'Design Systems' } } }
                  ]}
                ]}
              ]},
              { type: 'row', props: { layout: { gap: '12', padding: '16' } }, children: [
                { type: 'button', props: { props: { text: 'Message', variant: 'outline' } } },
                { type: 'button', props: { props: { text: 'Follow', variant: 'primary' } } }
              ]}
            ]},
            { type: 'row', props: { aiContext: 'Profile body: left sidebar with stats and about, right main feed with tabs and photo grid.', layout: { gap: '40', padding: '48', align: 'start' } }, children: [
              { type: 'column', props: { aiContext: 'Profile sidebar: stats card and about card.', layout: { gap: '24', width: '280' } }, children: [
                { type: 'card', props: { aiContext: 'Stats card: posts, followers, following counts.', layout: { padding: '24', gap: '16' } }, children: [
                  { type: 'heading', props: { props: { text: 'Stats', level: 'h4' } } },
                  { type: 'row', props: { layout: { gap: '0' } }, children: [
                    { type: 'column', props: { layout: { align: 'center', padding: '16' } }, children: [
                      { type: 'heading', props: { props: { text: '284', level: 'h3' } } },
                      { type: 'text', props: { props: { text: 'Posts', variant: 'muted' } } }
                    ]},
                    { type: 'column', props: { layout: { align: 'center', padding: '16' } }, children: [
                      { type: 'heading', props: { props: { text: '12.4K', level: 'h3' } } },
                      { type: 'text', props: { props: { text: 'Followers', variant: 'muted' } } }
                    ]},
                    { type: 'column', props: { layout: { align: 'center', padding: '16' } }, children: [
                      { type: 'heading', props: { props: { text: '348', level: 'h3' } } },
                      { type: 'text', props: { props: { text: 'Following', variant: 'muted' } } }
                    ]}
                  ]}
                ]},
                { type: 'card', props: { aiContext: 'About card: bio, company, location, link.', layout: { padding: '24', gap: '16' } }, children: [
                  { type: 'heading', props: { props: { text: 'About', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'I design digital products that make people smile. Currently exploring AI and spatial computing. Based in San Francisco.' } } },
                  { type: 'divider' },
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'row', props: { layout: { gap: '8' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'DesignCo' } } }] },
                    { type: 'row', props: { layout: { gap: '8' } }, children: [{ type: 'icon' }, { type: 'text', props: { props: { text: 'San Francisco, CA' } } }] },
                    { type: 'row', props: { layout: { gap: '8' } }, children: [{ type: 'icon' }, { type: 'link', props: { props: { text: 'sarahconnor.design' } } }] }
                  ]}
                ]}
              ]},
              { type: 'column', props: { aiContext: 'Profile main feed: tabs, photo grid, featured case study card.', layout: { gap: '24' } }, children: [
                { type: 'tabs', props: { props: { text: 'Posts | Projects | Liked' } } },
                { type: 'row', props: { aiContext: 'Photo grid: two columns of images.', layout: { gap: '16' } }, children: [
                  { type: 'column', props: { layout: { gap: '16' } }, children: [
                    { type: 'image', props: { layout: { width: '280', height: '280' }, style: { rounded: 'rounded-xl' } } },
                    { type: 'image', props: { layout: { width: '280', height: '180' }, style: { rounded: 'rounded-xl' } } }
                  ]},
                  { type: 'column', props: { layout: { gap: '16' } }, children: [
                    { type: 'image', props: { layout: { width: '280', height: '180' }, style: { rounded: 'rounded-xl' } } },
                    { type: 'image', props: { layout: { width: '280', height: '280' }, style: { rounded: 'rounded-xl' } } }
                  ]}
                ]},
                { type: 'card', props: { aiContext: 'Featured case study card.', layout: { padding: '24', gap: '16' } }, children: [
                  { type: 'badge', props: { props: { text: 'Case Study' } } },
                  { type: 'heading', props: { props: { text: 'Redesigning the DesignCo Dashboard', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'A 3-month project that increased user engagement by 40% through systematic UX improvements.', variant: 'muted' } } },
                  { type: 'row', props: { layout: { gap: '8' } }, children: [
                    { type: 'tag', props: { props: { text: 'UX Research' } } },
                    { type: 'tag', props: { props: { text: 'Figma' } } },
                    { type: 'tag', props: { props: { text: 'Design System' } } }
                  ]},
                  { type: 'button', props: { props: { text: 'Read Case Study', variant: 'outline' } } }
                ]}
              ]}
            ]}
          ]
        }
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { aiContext: 'Mobile profile: cover photo, avatar + name centered, stats row, tabs, photo grid, case study card.', layout: { gap: '0' } },
          children: [
            { type: 'image', props: { aiContext: 'Cover photo.', layout: { height: '160' }, style: { rounded: 'rounded-none' } } },
            { type: 'column', props: { layout: { align: 'center', padding: '20', gap: '16' } }, children: [
              { type: 'image', props: { layout: { width: '96', height: '96' }, style: { rounded: 'rounded-full', border: 'border-4 border-background' } } },
              { type: 'column', props: { layout: { align: 'center', gap: '4' } }, children: [
                { type: 'heading', props: { props: { text: 'Sarah Connor', level: 'h2' } } },
                { type: 'text', props: { props: { text: 'Product Designer', variant: 'muted' } } }
              ]},
              { type: 'row', props: { layout: { gap: '16' } }, children: [
                { type: 'button', props: { props: { text: 'Message', variant: 'outline' } } },
                { type: 'button', props: { props: { text: 'Follow', variant: 'primary' } } }
              ]}
            ]},
            { type: 'row', props: { aiContext: 'Stats row: posts, followers, following.', layout: { justify: 'justify-around', padding: '20' } }, children: [
              { type: 'column', props: { layout: { align: 'center' } }, children: [
                { type: 'heading', props: { props: { text: '284', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Posts', variant: 'muted' } } }
              ]},
              { type: 'column', props: { layout: { align: 'center' } }, children: [
                { type: 'heading', props: { props: { text: '12.4K', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Followers', variant: 'muted' } } }
              ]},
              { type: 'column', props: { layout: { align: 'center' } }, children: [
                { type: 'heading', props: { props: { text: '348', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Following', variant: 'muted' } } }
              ]}
            ]},
            { type: 'tabs', props: { props: { text: 'Posts | Projects | Liked' } } },
            { type: 'column', props: { aiContext: 'Mobile photo grid: two rows of two images each.', layout: { padding: '16', gap: '12' } }, children: [
              { type: 'row', props: { layout: { gap: '12' } }, children: [
                { type: 'image', props: { layout: { width: '180', height: '180' }, style: { rounded: 'rounded-xl' } } },
                { type: 'image', props: { layout: { width: '180', height: '180' }, style: { rounded: 'rounded-xl' } } }
              ]},
              { type: 'row', props: { layout: { gap: '12' } }, children: [
                { type: 'image', props: { layout: { width: '180', height: '120' }, style: { rounded: 'rounded-xl' } } },
                { type: 'image', props: { layout: { width: '180', height: '120' }, style: { rounded: 'rounded-xl' } } }
              ]}
            ]},
            { type: 'section', props: { aiContext: 'Mobile case study card section.', layout: { padding: '20', gap: '16' } }, children: [
              { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
                { type: 'badge', props: { props: { text: 'Case Study' } } },
                { type: 'heading', props: { props: { text: 'Redesigning the Dashboard', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Increased engagement by 40% through UX improvements.', variant: 'muted' } } },
                { type: 'button', props: { props: { text: 'Read Case Study', variant: 'outline', fullWidth: true } } }
              ]}
            ]}
          ]
        }
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'contact-us',
    name: 'Contact Us',
    category: 'Landing Pages',
    description: 'A split layout with contact information on one side and a message form on the other.',
    icon: Mail,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { layout: { padding: '80' }, style: { maxWidth: 'max-w-6xl', margin: 'mx-auto' } },
          children: [
            { type: 'row', props: { layout: { gap: '80', align: 'start' } }, children: [
              { type: 'column', props: { aiContext: 'Left contact info panel', layout: { gap: '32', width: '480' } }, children: [
                { type: 'badge', props: { props: { text: 'Get in Touch' } } },
                { type: 'heading', props: { props: { text: "Let's start a conversation", level: 'h1' } } },
                { type: 'text', props: { props: { text: "Have a project in mind? We'd love to hear about it. Send us a message and we'll get back within 24 hours.", variant: 'muted' } } },
                { type: 'column', props: { layout: { gap: '20' } }, children: [
                  { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                    { type: 'icon' },
                    { type: 'column', children: [
                      { type: 'heading', props: { props: { text: 'Email us', level: 'h4' } } },
                      { type: 'link', props: { props: { text: 'hello@company.com' } } }
                    ]}
                  ]},
                  { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                    { type: 'icon' },
                    { type: 'column', children: [
                      { type: 'heading', props: { props: { text: 'Call us', level: 'h4' } } },
                      { type: 'text', props: { props: { text: '+1 (555) 000-0000', variant: 'muted' } } }
                    ]}
                  ]},
                  { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                    { type: 'icon' },
                    { type: 'column', children: [
                      { type: 'heading', props: { props: { text: 'Visit us', level: 'h4' } } },
                      { type: 'text', props: { props: { text: '123 Innovation Drive, San Francisco, CA', variant: 'muted' } } }
                    ]}
                  ]}
                ]},
                { type: 'divider' },
                { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                  { type: 'text', props: { props: { text: 'Follow us:', variant: 'muted' } } },
                  { type: 'row', props: { layout: { gap: '12' } }, children: [
                    { type: 'icon' },
                    { type: 'icon' },
                    { type: 'icon' },
                    { type: 'icon' }
                  ]}
                ]},
                { type: 'map', props: { layout: { height: '220' }, style: { rounded: 'rounded-xl' } } }
              ]},
              { type: 'card', props: { aiContext: 'Right contact form', layout: { padding: '48', gap: '24', width: '520' } }, children: [
                { type: 'heading', props: { props: { text: 'Send a message', level: 'h3' } } },
                { type: 'row', props: { layout: { gap: '16' } }, children: [
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'First Name' } } },
                    { type: 'input', props: { props: { placeholder: 'Jane' } } }
                  ]},
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'Last Name' } } },
                    { type: 'input', props: { props: { placeholder: 'Doe' } } }
                  ]}
                ]},
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'Email' } } },
                  { type: 'input', props: { props: { placeholder: 'jane@company.com', type: 'email' } } }
                ]},
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'Subject' } } },
                  { type: 'select', props: { props: { placeholder: 'Select topic...' } } }
                ]},
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'Message' } } },
                  { type: 'textarea', props: { props: { placeholder: 'Describe your project or question...' } } }
                ]},
                { type: 'column', props: { layout: { gap: '8' } }, children: [
                  { type: 'text', props: { props: { text: 'Budget range' } } },
                  { type: 'select', props: { props: { placeholder: 'Select budget...' } } }
                ]},
                { type: 'button', props: { props: { text: 'Send Message', variant: 'primary', fullWidth: true } } },
                { type: 'text', props: { props: { text: "We'll respond within 24 hours. All inquiries are confidential.", variant: 'muted' } } }
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { layout: { padding: '24', gap: '28' } },
          children: [
            { type: 'badge', props: { props: { text: 'Get in Touch' } } },
            { type: 'heading', props: { props: { text: "Let's talk", level: 'h1' } } },
            { type: 'column', props: { layout: { gap: '16' } }, children: [
              { type: 'row', props: { layout: { gap: '12' } }, children: [
                { type: 'icon' },
                { type: 'text', props: { props: { text: 'hello@company.com' } } }
              ]},
              { type: 'row', props: { layout: { gap: '12' } }, children: [
                { type: 'icon' },
                { type: 'text', props: { props: { text: '+1 (555) 000-0000' } } }
              ]},
              { type: 'row', props: { layout: { gap: '12' } }, children: [
                { type: 'icon' },
                { type: 'text', props: { props: { text: 'San Francisco, CA' } } }
              ]}
            ]},
            { type: 'card', props: { layout: { padding: '24', gap: '20' } }, children: [
              { type: 'input', props: { props: { placeholder: 'Your name' } } },
              { type: 'input', props: { props: { placeholder: 'Email address', type: 'email' } } },
              { type: 'select', props: { props: { placeholder: 'Topic...' } } },
              { type: 'textarea', props: { props: { placeholder: 'Tell us about your project...' } } },
              { type: 'button', props: { props: { text: 'Send Message', variant: 'primary', fullWidth: true } } }
            ]}
          ]
        },
        MobileFooter
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'faq',
    name: 'FAQ Center',
    category: 'Content',
    description: 'Frequently Asked Questions page with search and expandable item structures.',
    icon: HelpCircle,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { layout: { padding: '80', gap: '48', align: 'center' }, style: { maxWidth: 'max-w-4xl', margin: 'mx-auto' } },
          children: [
            { type: 'column', props: { layout: { align: 'center', gap: '20' } }, children: [
              { type: 'badge', props: { props: { text: 'FAQ' } } },
              { type: 'heading', props: { props: { text: 'Frequently Asked Questions', level: 'h1' } } },
              { type: 'text', props: { props: { text: "Can't find what you're looking for? Contact our support team.", variant: 'muted' } } },
              { type: 'search', props: { props: { placeholder: 'Search questions...' }, layout: { width: '560' } } }
            ]},
            { type: 'row', props: { layout: { gap: '48', align: 'start' } }, children: [
              { type: 'column', props: { aiContext: 'Category sidebar', layout: { gap: '8', width: '200' } }, children: [
                { type: 'button', props: { props: { text: 'All Topics', variant: 'secondary', fullWidth: true } } },
                { type: 'button', props: { props: { text: 'Getting Started', variant: 'ghost', fullWidth: true } } },
                { type: 'button', props: { props: { text: 'Billing', variant: 'ghost', fullWidth: true } } },
                { type: 'button', props: { props: { text: 'Features', variant: 'ghost', fullWidth: true } } },
                { type: 'button', props: { props: { text: 'Integrations', variant: 'ghost', fullWidth: true } } },
                { type: 'button', props: { props: { text: 'Account', variant: 'ghost', fullWidth: true } } }
              ]},
              { type: 'accordion', props: { aiContext: 'FAQ accordion with 6 questions: How do I get started?, Is there a free trial?, What payment methods do you accept?, Can I cancel anytime?, How do I add team members?, Is my data secure?', layout: { gap: '0' } } }
            ]},
            { type: 'card', props: { aiContext: 'Support CTA card', layout: { padding: '40', gap: '20' } }, children: [
              { type: 'column', props: { layout: { align: 'center', gap: '12' } }, children: [
                { type: 'heading', props: { props: { text: 'Still have questions?', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Our support team is available 24/7 to help you.', variant: 'muted' } } },
                { type: 'row', props: { layout: { gap: '16' } }, children: [
                  { type: 'button', props: { props: { text: 'Chat with us', variant: 'primary' } } },
                  { type: 'button', props: { props: { text: 'Email support', variant: 'outline' } } }
                ]}
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { layout: { padding: '20', gap: '24' } },
          children: [
            { type: 'badge', props: { props: { text: 'FAQ' } } },
            { type: 'heading', props: { props: { text: 'FAQs', level: 'h1' } } },
            { type: 'search', props: { props: { placeholder: 'Search...' } } },
            { type: 'tabs', props: { props: { text: 'All | Billing | Features | Account' } } },
            { type: 'accordion', props: { aiContext: 'FAQ accordion with 5 questions' } },
            { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [
              { type: 'heading', props: { props: { text: 'Still need help?', level: 'h4' } } },
              { type: 'text', props: { props: { text: 'Our team is available 24/7.', variant: 'muted' } } },
              { type: 'button', props: { props: { text: 'Contact Support', variant: 'primary', fullWidth: true } } }
            ]}
          ]
        },
        MobileFooter
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'newsletter',
    name: 'Newsletter Signup',
    category: 'Landing Pages',
    description: 'High-conversion hero section focused entirely on capturing email subscriptions.',
    icon: Send,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { layout: { align: 'center', justify: 'center', padding: '100', gap: '0' }, style: { minHeight: 'min-h-[70vh]' } },
          children: [
            { type: 'column', props: { layout: { align: 'center', gap: '32' }, style: { maxWidth: 'max-w-2xl', margin: 'mx-auto' } }, children: [
              { type: 'badge', props: { props: { text: 'Newsletter' } } },
              { type: 'heading', props: { props: { text: 'Stay ahead of the curve', level: 'h1' } } },
              { type: 'text', props: { props: { text: 'Join 50,000+ developers and founders receiving our weekly curated digest of tools, articles, and industry insights. Unsubscribe anytime.', variant: 'muted' } } },
              { type: 'row', props: { layout: { gap: '0' }, style: { width: 'w-full', maxWidth: 'max-w-md' } }, children: [
                { type: 'input', props: { props: { placeholder: 'Enter your email address', type: 'email' } } },
                { type: 'button', props: { props: { text: 'Subscribe Free', variant: 'primary' } } }
              ]},
              { type: 'text', props: { props: { text: 'No spam, ever. Unsubscribe in one click.', variant: 'muted' } } },
              { type: 'row', props: { aiContext: 'Social proof stats', layout: { gap: '32', align: 'center' } }, children: [
                { type: 'column', props: { layout: { align: 'center', gap: '4' } }, children: [
                  { type: 'heading', props: { props: { text: '50K+', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'Subscribers', variant: 'muted' } } }
                ]},
                { type: 'column', props: { layout: { align: 'center', gap: '4' } }, children: [
                  { type: 'heading', props: { props: { text: '4.9★', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'Avg rating', variant: 'muted' } } }
                ]},
                { type: 'column', props: { layout: { align: 'center', gap: '4' } }, children: [
                  { type: 'heading', props: { props: { text: 'Weekly', level: 'h3' } } },
                  { type: 'text', props: { props: { text: 'Frequency', variant: 'muted' } } }
                ]}
              ]}
            ]},
            { type: 'row', props: { aiContext: 'Testimonials row', layout: { gap: '24', justify: 'center' } }, children: [
              { type: 'card', props: { layout: { padding: '28', gap: '16', width: '340' } }, children: [
                { type: 'text', props: { props: { text: '"The most valuable newsletter in my inbox. Actionable insights every week."' } } },
                { type: 'row', props: { layout: { gap: '12', align: 'center' } }, children: [
                  { type: 'image', props: { layout: { width: '40', height: '40' }, style: { rounded: 'rounded-full' } } },
                  { type: 'column', children: [
                    { type: 'heading', props: { props: { text: 'Alex Johnson', level: 'h4' } } },
                    { type: 'text', props: { props: { text: 'Senior Engineer', variant: 'muted' } } }
                  ]}
                ]},
                { type: 'rating' }
              ]},
              { type: 'card', props: { layout: { padding: '28', gap: '16', width: '340' } }, children: [
                { type: 'text', props: { props: { text: '"Helped me discover 3 tools that cut my workflow time in half. Worth every minute."' } } },
                { type: 'row', props: { layout: { gap: '12', align: 'center' } }, children: [
                  { type: 'image', props: { layout: { width: '40', height: '40' }, style: { rounded: 'rounded-full' } } },
                  { type: 'column', children: [
                    { type: 'heading', props: { props: { text: 'Sarah Lee', level: 'h4' } } },
                    { type: 'text', props: { props: { text: 'Founder, DesignCo', variant: 'muted' } } }
                  ]}
                ]},
                { type: 'rating' }
              ]},
              { type: 'card', props: { layout: { padding: '28', gap: '16', width: '340' } }, children: [
                { type: 'text', props: { props: { text: '"The go-to resource for staying current with modern development. Highly recommended."' } } },
                { type: 'row', props: { layout: { gap: '12', align: 'center' } }, children: [
                  { type: 'image', props: { layout: { width: '40', height: '40' }, style: { rounded: 'rounded-full' } } },
                  { type: 'column', children: [
                    { type: 'heading', props: { props: { text: 'Mike Chen', level: 'h4' } } },
                    { type: 'text', props: { props: { text: 'CTO, StartupXYZ', variant: 'muted' } } }
                  ]}
                ]},
                { type: 'rating' }
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'section',
          props: { layout: { padding: '40', gap: '28', align: 'center' } },
          children: [
            { type: 'badge', props: { props: { text: 'Newsletter' } } },
            { type: 'heading', props: { props: { text: 'Stay ahead of the curve', level: 'h1' } } },
            { type: 'text', props: { props: { text: 'Join 50,000+ developers. Unsubscribe anytime.', variant: 'muted' } } },
            { type: 'column', props: { layout: { gap: '16' } }, children: [
              { type: 'input', props: { props: { placeholder: 'Your email address', type: 'email' } } },
              { type: 'button', props: { props: { text: 'Subscribe Free', variant: 'primary', fullWidth: true } } }
            ]},
            { type: 'text', props: { props: { text: 'No spam, ever.', variant: 'muted' } } },
            { type: 'row', props: { layout: { gap: '24', justify: 'center' } }, children: [
              { type: 'column', props: { layout: { align: 'center' } }, children: [
                { type: 'heading', props: { props: { text: '50K+', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Readers', variant: 'muted' } } }
              ]},
              { type: 'column', props: { layout: { align: 'center' } }, children: [
                { type: 'heading', props: { props: { text: '4.9★', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Rating', variant: 'muted' } } }
              ]}
            ]},
            { type: 'card', props: { layout: { padding: '24', gap: '12' } }, children: [
              { type: 'text', props: { props: { text: '"Most valuable newsletter in my inbox."' } } },
              { type: 'row', props: { layout: { gap: '10' } }, children: [
                { type: 'image', props: { layout: { width: '36', height: '36' }, style: { rounded: 'rounded-full' } } },
                { type: 'column', children: [
                  { type: 'heading', props: { props: { text: 'Alex Johnson', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Senior Engineer', variant: 'muted' } } }
                ]}
              ]}
            ]}
          ]
        },
        MobileFooter
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'features-showcase',
    name: 'Features Showcase',
    category: 'Landing Pages',
    description: 'A 3-column grid highlighting the key benefits or features of a product.',
    icon: Star,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { layout: { padding: '80', gap: '64', align: 'center' }, style: { maxWidth: 'max-w-7xl', margin: 'mx-auto' } },
          children: [
            { type: 'column', props: { layout: { align: 'center', gap: '20' } }, children: [
              { type: 'badge', props: { props: { text: 'Features' } } },
              { type: 'heading', props: { props: { text: 'Everything you need to build faster', level: 'h1' } } },
              { type: 'text', props: { props: { text: "A complete toolkit for modern development teams. From design to deployment, we've got you covered.", variant: 'muted' } } }
            ]},
            { type: 'row', props: { aiContext: 'Feature grid row 1', layout: { gap: '24' } }, children: [
              { type: 'card', props: { layout: { padding: '32', gap: '20', width: '380' } }, children: [
                { type: 'icon' },
                { type: 'heading', props: { props: { text: 'Lightning Fast', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Built on edge infrastructure for sub-100ms response times globally. No cold starts, ever.', variant: 'muted' } } },
                { type: 'link', props: { props: { text: 'Learn more →' } } }
              ]},
              { type: 'card', props: { layout: { padding: '32', gap: '20', width: '380' } }, children: [
                { type: 'icon' },
                { type: 'heading', props: { props: { text: 'Secure by Default', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Enterprise-grade security with SOC2 Type II, end-to-end encryption, and role-based access control.', variant: 'muted' } } },
                { type: 'link', props: { props: { text: 'Learn more →' } } }
              ]},
              { type: 'card', props: { layout: { padding: '32', gap: '20', width: '380' } }, children: [
                { type: 'icon' },
                { type: 'heading', props: { props: { text: 'Fully Responsive', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Every component adapts perfectly to any screen size. Mobile-first design baked in from day one.', variant: 'muted' } } },
                { type: 'link', props: { props: { text: 'Learn more →' } } }
              ]}
            ]},
            { type: 'row', props: { aiContext: 'Feature grid row 2', layout: { gap: '24' } }, children: [
              { type: 'card', props: { layout: { padding: '32', gap: '20', width: '380' } }, children: [
                { type: 'icon' },
                { type: 'heading', props: { props: { text: 'AI-Powered', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Intelligent suggestions, automated workflows, and predictive analytics powered by state-of-the-art models.', variant: 'muted' } } },
                { type: 'link', props: { props: { text: 'Learn more →' } } }
              ]},
              { type: 'card', props: { layout: { padding: '32', gap: '20', width: '380' } }, children: [
                { type: 'icon' },
                { type: 'heading', props: { props: { text: 'Team Collaboration', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Real-time multiplayer editing, threaded comments, and role-based permissions for every team size.', variant: 'muted' } } },
                { type: 'link', props: { props: { text: 'Learn more →' } } }
              ]},
              { type: 'card', props: { layout: { padding: '32', gap: '20', width: '380' } }, children: [
                { type: 'icon' },
                { type: 'heading', props: { props: { text: '100+ Integrations', level: 'h3' } } },
                { type: 'text', props: { props: { text: 'Connect to Slack, GitHub, Jira, Salesforce, and hundreds more tools your team already uses.', variant: 'muted' } } },
                { type: 'link', props: { props: { text: 'Learn more →' } } }
              ]}
            ]},
            { type: 'card', props: { aiContext: 'Testimonial / social proof', layout: { padding: '64', gap: '32' } }, children: [
              { type: 'row', props: { layout: { justify: 'between', align: 'center' } }, children: [
                { type: 'column', props: { layout: { gap: '16', width: '520' } }, children: [
                  { type: 'badge', props: { props: { text: 'Customer Story' } } },
                  { type: 'heading', props: { props: { text: 'Shipped 3x faster with our platform', level: 'h2' } } },
                  { type: 'text', props: { props: { text: 'TechCorp cut their release cycle from 3 weeks to 5 days by standardizing on our platform. Their engineering team now spends 60% less time on infrastructure.', variant: 'muted' } } },
                  { type: 'row', props: { layout: { gap: '16' } }, children: [
                    { type: 'button', props: { props: { text: 'Read Case Study', variant: 'primary' } } },
                    { type: 'button', props: { props: { text: 'Book a Demo', variant: 'outline' } } }
                  ]}
                ]},
                { type: 'image', props: { layout: { width: '420', height: '300' }, style: { rounded: 'rounded-2xl' } } }
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'section',
          props: { layout: { padding: '24', gap: '32' } },
          children: [
            { type: 'column', props: { layout: { align: 'center', gap: '16' } }, children: [
              { type: 'badge', props: { props: { text: 'Features' } } },
              { type: 'heading', props: { props: { text: 'Everything you need', level: 'h1' } } },
              { type: 'text', props: { props: { text: 'A complete toolkit for modern dev teams.', variant: 'muted' } } }
            ]},
            { type: 'column', props: { layout: { gap: '16' } }, children: [
              { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [{ type: 'icon' }, { type: 'heading', props: { props: { text: 'Lightning Fast', level: 'h3' } } }, { type: 'text', props: { props: { text: 'Sub-100ms globally. No cold starts.', variant: 'muted' } } }] },
              { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [{ type: 'icon' }, { type: 'heading', props: { props: { text: 'Secure by Default', level: 'h3' } } }, { type: 'text', props: { props: { text: 'SOC2 Type II certified. E2E encrypted.', variant: 'muted' } } }] },
              { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [{ type: 'icon' }, { type: 'heading', props: { props: { text: 'AI-Powered', level: 'h3' } } }, { type: 'text', props: { props: { text: 'Smart suggestions and automation.', variant: 'muted' } } }] },
              { type: 'card', props: { layout: { padding: '24', gap: '16' } }, children: [{ type: 'icon' }, { type: 'heading', props: { props: { text: '100+ Integrations', level: 'h3' } } }, { type: 'text', props: { props: { text: 'Connect to your favorite tools.', variant: 'muted' } } }] }
            ]},
            { type: 'button', props: { props: { text: 'Start Free Trial', variant: 'primary', fullWidth: true } } },
            { type: 'button', props: { props: { text: 'Book a Demo', variant: 'outline', fullWidth: true } } }
          ]
        },
        MobileFooter
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'image-gallery',
    name: 'Image Gallery',
    category: 'Content',
    description: 'A masonry-style grid for displaying photographs or portfolio pieces.',
    icon: ImageIcon,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { layout: { padding: '48', gap: '32' }, style: { maxWidth: 'max-w-7xl', margin: 'mx-auto' } },
          children: [
            { type: 'row', props: { layout: { justify: 'between', align: 'center' } }, children: [
              { type: 'column', props: { layout: { gap: '8' } }, children: [
                { type: 'heading', props: { props: { text: 'Photography Gallery', level: 'h1' } } },
                { type: 'text', props: { props: { text: 'A curated collection of moments.', variant: 'muted' } } }
              ]},
              { type: 'row', props: { layout: { gap: '16' } }, children: [
                { type: 'select', props: { props: { placeholder: 'All Categories' } } },
                { type: 'button', props: { props: { text: 'Upload', variant: 'outline' } } }
              ]}
            ]},
            { type: 'row', props: { layout: { gap: '8' } }, children: [
              { type: 'tag', props: { props: { text: 'All' } } },
              { type: 'tag', props: { props: { text: 'Architecture' } } },
              { type: 'tag', props: { props: { text: 'Nature' } } },
              { type: 'tag', props: { props: { text: 'Portrait' } } },
              { type: 'tag', props: { props: { text: 'Street' } } },
              { type: 'tag', props: { props: { text: 'Abstract' } } }
            ]},
            { type: 'row', props: { layout: { gap: '24' } }, children: [
              { type: 'column', props: { layout: { width: 'w-1/3', gap: '24' } }, children: [
                { type: 'image', props: { layout: { width: '450', height: '384' }, style: { rounded: 'rounded-2xl' } } },
                { type: 'image', props: { layout: { width: '450', height: '256' }, style: { rounded: 'rounded-2xl' } } }
              ]},
              { type: 'column', props: { layout: { width: 'w-1/3', gap: '24' } }, children: [
                { type: 'image', props: { layout: { width: '450', height: '256' }, style: { rounded: 'rounded-2xl' } } },
                { type: 'image', props: { layout: { width: '450', height: '384' }, style: { rounded: 'rounded-2xl' } } }
              ]},
              { type: 'column', props: { layout: { width: 'w-1/3', gap: '24' } }, children: [
                { type: 'image', props: { layout: { width: '450', height: '320' }, style: { rounded: 'rounded-2xl' } } },
                { type: 'image', props: { layout: { width: '450', height: '320' }, style: { rounded: 'rounded-2xl' } } }
              ]}
            ]},
            { type: 'pagination' }
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { layout: { padding: '16', gap: '20' } },
          children: [
            { type: 'heading', props: { props: { text: 'Gallery', level: 'h2' } } },
            { type: 'search', props: { props: { placeholder: 'Search photos...' } } },
            { type: 'row', props: { layout: { gap: '8' } }, children: [
              { type: 'tag', props: { props: { text: 'All' } } },
              { type: 'tag', props: { props: { text: 'Architecture' } } },
              { type: 'tag', props: { props: { text: 'Nature' } } }
            ]},
            { type: 'image', props: { layout: { height: '280' }, style: { rounded: 'rounded-2xl' } } },
            { type: 'row', props: { layout: { gap: '12' } }, children: [
              { type: 'image', props: { layout: { width: '180', height: '180' }, style: { rounded: 'rounded-xl' } } },
              { type: 'image', props: { layout: { width: '180', height: '180' }, style: { rounded: 'rounded-xl' } } }
            ]},
            { type: 'image', props: { layout: { height: '240' }, style: { rounded: 'rounded-2xl' } } },
            { type: 'row', props: { layout: { gap: '12' } }, children: [
              { type: 'image', props: { layout: { width: '180', height: '120' }, style: { rounded: 'rounded-xl' } } },
              { type: 'image', props: { layout: { width: '180', height: '120' }, style: { rounded: 'rounded-xl' } } }
            ]},
            { type: 'pagination' }
          ]
        },
        MobileFooter
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'error-404',
    name: 'Error 404',
    category: 'System',
    description: 'A playful and clean Page Not Found layout to guide users back.',
    icon: AlertTriangle,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { layout: { align: 'center', justify: 'center', padding: '80', gap: '48' }, style: { minHeight: 'min-h-[80vh]' } },
          children: [
            { type: 'column', props: { layout: { align: 'center', gap: '32' }, style: { maxWidth: 'max-w-2xl', margin: 'mx-auto' } }, children: [
              { type: 'badge', props: { props: { text: 'Error 404' } } },
              { type: 'heading', props: { props: { text: 'Page not found', level: 'h1' } } },
              { type: 'text', props: { props: { text: "Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.", variant: 'muted' } } },
              { type: 'row', props: { layout: { gap: '16', justify: 'center' } }, children: [
                { type: 'button', props: { props: { text: '← Go Back', variant: 'outline' } } },
                { type: 'button', props: { props: { text: 'Back to Home', variant: 'primary' } } }
              ]},
              { type: 'divider' },
              { type: 'column', props: { layout: { align: 'center', gap: '16' } }, children: [
                { type: 'text', props: { props: { text: 'Looking for something?', variant: 'muted' } } },
                { type: 'search', props: { props: { placeholder: 'Search the site...' } } }
              ]},
              { type: 'column', props: { layout: { gap: '12' } }, children: [
                { type: 'text', props: { props: { text: 'Popular pages:', variant: 'muted' } } },
                { type: 'row', props: { layout: { gap: '16', justify: 'center' } }, children: [
                  { type: 'link', props: { props: { text: 'Home' } } },
                  { type: 'link', props: { props: { text: 'Features' } } },
                  { type: 'link', props: { props: { text: 'Pricing' } } },
                  { type: 'link', props: { props: { text: 'Documentation' } } },
                  { type: 'link', props: { props: { text: 'Blog' } } }
                ]}
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { layout: { padding: '32', align: 'center', justify: 'center', gap: '24' }, style: { minHeight: 'min-h-[70vh]' } },
          children: [
            { type: 'heading', props: { props: { text: '404', level: 'h1' } } },
            { type: 'heading', props: { props: { text: 'Page not found', level: 'h2' } } },
            { type: 'text', props: { props: { text: "The page you're looking for doesn't exist.", variant: 'muted' } } },
            { type: 'button', props: { props: { text: 'Back to Home', variant: 'primary', fullWidth: true } } },
            { type: 'button', props: { props: { text: 'Go Back', variant: 'outline', fullWidth: true } } },
            { type: 'search', props: { props: { placeholder: 'Search the site...' } } }
          ]
        }
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'checkout-flow',
    name: 'Checkout Flow',
    category: 'E-Commerce',
    description: 'Two-column checkout: form on the left, order summary on the right.',
    icon: CheckCircle,
    build: () => {
      const desktopNodes: NodeDef[] = [
        DesktopNavbar,
        {
          type: 'section',
          props: { layout: { padding: '48' }, style: { maxWidth: 'max-w-6xl', margin: 'mx-auto' } },
          children: [
            { type: 'breadcrumb', props: { props: { text: 'Cart / Shipping / Payment / Confirm' } } },
            { type: 'stepper', props: { aiContext: '4-step checkout stepper: Cart, Shipping, Payment, Confirm' } },
            { type: 'row', props: { layout: { gap: '48', align: 'start' } }, children: [
              { type: 'column', props: { aiContext: 'Checkout form', layout: { gap: '28', width: '700' } }, children: [
                { type: 'heading', props: { props: { text: 'Shipping Information', level: 'h2' } } },
                { type: 'card', props: { layout: { padding: '32', gap: '24' } }, children: [
                  { type: 'row', props: { layout: { gap: '20' } }, children: [
                    { type: 'column', props: { layout: { gap: '8' } }, children: [
                      { type: 'text', props: { props: { text: 'First Name' } } },
                      { type: 'input', props: { props: { placeholder: 'Jane' } } }
                    ]},
                    { type: 'column', props: { layout: { gap: '8' } }, children: [
                      { type: 'text', props: { props: { text: 'Last Name' } } },
                      { type: 'input', props: { props: { placeholder: 'Doe' } } }
                    ]}
                  ]},
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'Email' } } },
                    { type: 'input', props: { props: { placeholder: 'jane@example.com', type: 'email' } } }
                  ]},
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'Address' } } },
                    { type: 'input', props: { props: { placeholder: '123 Main Street' } } }
                  ]},
                  { type: 'row', props: { layout: { gap: '20' } }, children: [
                    { type: 'column', props: { layout: { gap: '8' } }, children: [
                      { type: 'text', props: { props: { text: 'City' } } },
                      { type: 'input', props: { props: { placeholder: 'San Francisco' } } }
                    ]},
                    { type: 'column', props: { layout: { gap: '8' } }, children: [
                      { type: 'text', props: { props: { text: 'ZIP' } } },
                      { type: 'input', props: { props: { placeholder: '94102' } } }
                    ]},
                    { type: 'column', props: { layout: { gap: '8' } }, children: [
                      { type: 'text', props: { props: { text: 'Country' } } },
                      { type: 'select', props: { props: { placeholder: 'United States' } } }
                    ]}
                  ]}
                ]},
                { type: 'heading', props: { props: { text: 'Payment', level: 'h2' } } },
                { type: 'card', props: { layout: { padding: '32', gap: '24' } }, children: [
                  { type: 'row', props: { layout: { gap: '16' } }, children: [
                    { type: 'button', props: { props: { text: 'Credit Card', variant: 'secondary' } } },
                    { type: 'button', props: { props: { text: 'PayPal', variant: 'ghost' } } },
                    { type: 'button', props: { props: { text: 'Apple Pay', variant: 'ghost' } } }
                  ]},
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'text', props: { props: { text: 'Card Number' } } },
                    { type: 'input', props: { props: { placeholder: '1234 5678 9012 3456' } } }
                  ]},
                  { type: 'row', props: { layout: { gap: '20' } }, children: [
                    { type: 'column', props: { layout: { gap: '8' } }, children: [
                      { type: 'text', props: { props: { text: 'Expiry' } } },
                      { type: 'input', props: { props: { placeholder: 'MM / YY' } } }
                    ]},
                    { type: 'column', props: { layout: { gap: '8' } }, children: [
                      { type: 'text', props: { props: { text: 'CVC' } } },
                      { type: 'input', props: { props: { placeholder: '•••' } } }
                    ]}
                  ]},
                  { type: 'checkbox', props: { props: { label: 'Save card for future purchases' } } }
                ]},
                { type: 'row', props: { layout: { justify: 'between', align: 'center' } }, children: [
                  { type: 'button', props: { props: { text: '← Back to Cart', variant: 'ghost' } } },
                  { type: 'button', props: { props: { text: 'Continue to Review →', variant: 'primary' } } }
                ]}
              ]},
              { type: 'column', props: { aiContext: 'Order summary sidebar', layout: { gap: '20', width: '380' } }, children: [
                { type: 'card', props: { layout: { padding: '28', gap: '20' } }, children: [
                  { type: 'heading', props: { props: { text: 'Order Summary', level: 'h3' } } },
                  { type: 'column', props: { layout: { gap: '16' } }, children: [
                    { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                      { type: 'image', props: { layout: { width: '64', height: '64' }, style: { rounded: 'rounded-xl' } } },
                      { type: 'column', children: [
                        { type: 'heading', props: { props: { text: 'Premium Headphones Pro', level: 'h4' } } },
                        { type: 'text', props: { props: { text: 'Color: Black · Qty: 1', variant: 'muted' } } },
                        { type: 'heading', props: { props: { text: '$299.00', level: 'h4' } } }
                      ]}
                    ]},
                    { type: 'row', props: { layout: { gap: '16', align: 'center' } }, children: [
                      { type: 'image', props: { layout: { width: '64', height: '64' }, style: { rounded: 'rounded-xl' } } },
                      { type: 'column', children: [
                        { type: 'heading', props: { props: { text: 'Leather Case', level: 'h4' } } },
                        { type: 'text', props: { props: { text: 'Color: Brown · Qty: 1', variant: 'muted' } } },
                        { type: 'heading', props: { props: { text: '$49.00', level: 'h4' } } }
                      ]}
                    ]}
                  ]},
                  { type: 'divider' },
                  { type: 'row', props: { layout: { justify: 'between' } }, children: [
                    { type: 'text', props: { props: { text: 'Subtotal' } } },
                    { type: 'text', props: { props: { text: '$348.00' } } }
                  ]},
                  { type: 'row', props: { layout: { justify: 'between' } }, children: [
                    { type: 'text', props: { props: { text: 'Shipping' } } },
                    { type: 'text', props: { props: { text: 'Free' } } }
                  ]},
                  { type: 'row', props: { layout: { justify: 'between' } }, children: [
                    { type: 'text', props: { props: { text: 'Tax' } } },
                    { type: 'text', props: { props: { text: '$27.84' } } }
                  ]},
                  { type: 'divider' },
                  { type: 'row', props: { layout: { justify: 'between' } }, children: [
                    { type: 'heading', props: { props: { text: 'Total', level: 'h4' } } },
                    { type: 'heading', props: { props: { text: '$375.84', level: 'h4' } } }
                  ]},
                  { type: 'alert', props: { props: { text: 'Free shipping on orders over $100!' } } },
                  { type: 'column', props: { layout: { gap: '8' } }, children: [
                    { type: 'input', props: { props: { placeholder: 'Promo code' } } },
                    { type: 'button', props: { props: { text: 'Apply', variant: 'outline', fullWidth: true } } }
                  ]}
                ]}
              ]}
            ]}
          ]
        },
        DesktopFooter
      ];

      const mobileNodes: NodeDef[] = [
        MobileNavbar,
        {
          type: 'column',
          props: { layout: { padding: '20', gap: '20' } },
          children: [
            { type: 'stepper', props: { aiContext: '4-step checkout stepper' } },
            { type: 'heading', props: { props: { text: 'Shipping', level: 'h2' } } },
            { type: 'card', props: { layout: { padding: '20', gap: '16' } }, children: [
              { type: 'input', props: { props: { placeholder: 'First Name' } } },
              { type: 'input', props: { props: { placeholder: 'Last Name' } } },
              { type: 'input', props: { props: { placeholder: 'Email', type: 'email' } } },
              { type: 'input', props: { props: { placeholder: 'Address' } } },
              { type: 'row', props: { layout: { gap: '12' } }, children: [
                { type: 'input', props: { props: { placeholder: 'City' } } },
                { type: 'input', props: { props: { placeholder: 'ZIP' } } }
              ]},
              { type: 'select', props: { props: { placeholder: 'Country' } } }
            ]},
            { type: 'heading', props: { props: { text: 'Payment', level: 'h2' } } },
            { type: 'card', props: { layout: { padding: '20', gap: '16' } }, children: [
              { type: 'input', props: { props: { placeholder: 'Card Number' } } },
              { type: 'row', props: { layout: { gap: '12' } }, children: [
                { type: 'input', props: { props: { placeholder: 'MM/YY' } } },
                { type: 'input', props: { props: { placeholder: 'CVC' } } }
              ]},
              { type: 'checkbox', props: { props: { label: 'Save card' } } }
            ]},
            { type: 'card', props: { aiContext: 'Order summary', layout: { padding: '20', gap: '12' } }, children: [
              { type: 'heading', props: { props: { text: 'Order Summary', level: 'h4' } } },
              { type: 'row', props: { layout: { justify: 'between' } }, children: [
                { type: 'text', props: { props: { text: 'Subtotal' } } },
                { type: 'text', props: { props: { text: '$348.00' } } }
              ]},
              { type: 'row', props: { layout: { justify: 'between' } }, children: [
                { type: 'text', props: { props: { text: 'Shipping' } } },
                { type: 'text', props: { props: { text: 'Free' } } }
              ]},
              { type: 'row', props: { layout: { justify: 'between' } }, children: [
                { type: 'heading', props: { props: { text: 'Total', level: 'h4' } } },
                { type: 'heading', props: { props: { text: '$375.84', level: 'h4' } } }
              ]}
            ]},
            { type: 'button', props: { props: { text: 'Complete Purchase', variant: 'primary', fullWidth: true } } }
          ]
        }
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  },
  {
    id: 'link-tree',
    name: 'Social Links',
    category: 'Social',
    description: 'A simple mobile-first page for a bio link (Linktree clone).',
    icon: LinkIcon,
    build: () => {
      const desktopNodes: NodeDef[] = [
        {
          type: 'column',
          props: { layout: { align: 'center', padding: '80', gap: '40' }, style: { maxWidth: 'max-w-md', margin: 'mx-auto', minHeight: 'min-h-screen' } },
          children: [
            { type: 'image', props: { layout: { width: '128', height: '128' }, style: { rounded: 'rounded-full' } } },
            { type: 'column', props: { layout: { align: 'center', gap: '8' } }, children: [
              { type: 'heading', props: { props: { text: '@creator', level: 'h2' } } },
              { type: 'text', props: { props: { text: 'Digital creator · Developer · Speaker', variant: 'muted' } } },
              { type: 'row', props: { layout: { gap: '12', justify: 'center' } }, children: [
                { type: 'badge', props: { props: { text: 'SF, CA' } } },
                { type: 'badge', props: { props: { text: 'Open to collab' } } }
              ]}
            ]},
            { type: 'column', props: { layout: { gap: '16' }, style: { width: 'w-full' } }, children: [
              { type: 'button', props: { props: { text: '🌐 My Website', variant: 'outline', fullWidth: true } } },
              { type: 'button', props: { props: { text: '📺 YouTube Channel', variant: 'outline', fullWidth: true } } },
              { type: 'button', props: { props: { text: '🐦 Twitter / X', variant: 'outline', fullWidth: true } } },
              { type: 'button', props: { props: { text: '💼 LinkedIn Profile', variant: 'outline', fullWidth: true } } },
              { type: 'button', props: { props: { text: '☕ Support on Ko-fi', variant: 'primary', fullWidth: true } } }
            ]},
            { type: 'divider' },
            { type: 'card', props: { layout: { padding: '24', gap: '12' } }, children: [
              { type: 'heading', props: { props: { text: 'Latest from me', level: 'h4' } } },
              { type: 'column', props: { layout: { gap: '12' } }, children: [
                { type: 'row', props: { layout: { gap: '12', align: 'center' } }, children: [
                  { type: 'image', props: { layout: { width: '56', height: '56' }, style: { rounded: 'rounded-xl' } } },
                  { type: 'column', children: [
                    { type: 'heading', props: { props: { text: 'Building AI Tools in 2025', level: 'h4' } } },
                    { type: 'text', props: { props: { text: 'YouTube · 24K views', variant: 'muted' } } }
                  ]}
                ]},
                { type: 'row', props: { layout: { gap: '12', align: 'center' } }, children: [
                  { type: 'image', props: { layout: { width: '56', height: '56' }, style: { rounded: 'rounded-xl' } } },
                  { type: 'column', children: [
                    { type: 'heading', props: { props: { text: 'My Minimal Dev Setup', level: 'h4' } } },
                    { type: 'text', props: { props: { text: 'Blog · 12 min read', variant: 'muted' } } }
                  ]}
                ]}
              ]}
            ]},
            { type: 'text', props: { props: { text: '© 2025 @creator', variant: 'muted' } } }
          ]
        }
      ];

      const mobileNodes: NodeDef[] = [
        {
          type: 'column',
          props: { layout: { align: 'center', padding: '32', gap: '28' }, style: { minHeight: 'min-h-screen' } },
          children: [
            { type: 'image', props: { layout: { width: '96', height: '96' }, style: { rounded: 'rounded-full' } } },
            { type: 'column', props: { layout: { align: 'center', gap: '6' } }, children: [
              { type: 'heading', props: { props: { text: '@creator', level: 'h2' } } },
              { type: 'text', props: { props: { text: 'Digital creator & developer', variant: 'muted' } } },
              { type: 'row', props: { layout: { gap: '8', justify: 'center' } }, children: [
                { type: 'badge', props: { props: { text: 'SF, CA' } } },
                { type: 'badge', props: { props: { text: 'Open to collab' } } }
              ]}
            ]},
            { type: 'column', props: { layout: { gap: '14' }, style: { width: 'w-full' } }, children: [
              { type: 'button', props: { props: { text: '🌐 My Website', variant: 'outline', fullWidth: true } } },
              { type: 'button', props: { props: { text: '📺 YouTube Channel', variant: 'outline', fullWidth: true } } },
              { type: 'button', props: { props: { text: '🐦 Twitter / X', variant: 'outline', fullWidth: true } } },
              { type: 'button', props: { props: { text: '💼 LinkedIn Profile', variant: 'outline', fullWidth: true } } },
              { type: 'button', props: { props: { text: '☕ Support on Ko-fi', variant: 'primary', fullWidth: true } } }
            ]},
            { type: 'card', props: { layout: { padding: '20', gap: '12' } }, children: [
              { type: 'heading', props: { props: { text: 'Latest', level: 'h4' } } },
              { type: 'row', props: { layout: { gap: '10' } }, children: [
                { type: 'image', props: { layout: { width: '48', height: '48' }, style: { rounded: 'rounded-lg' } } },
                { type: 'column', children: [
                  { type: 'heading', props: { props: { text: 'AI Tools in 2025', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'YouTube · 24K views', variant: 'muted' } } }
                ]}
              ]},
              { type: 'row', props: { layout: { gap: '10' } }, children: [
                { type: 'image', props: { layout: { width: '48', height: '48' }, style: { rounded: 'rounded-lg' } } },
                { type: 'column', children: [
                  { type: 'heading', props: { props: { text: 'My Dev Setup', level: 'h4' } } },
                  { type: 'text', props: { props: { text: 'Blog · 12 min', variant: 'muted' } } }
                ]}
              ]}
            ]},
            { type: 'text', props: { props: { text: '© 2025 @creator', variant: 'muted' } } }
          ]
        }
      ];

      return buildNodes(mobileNodes, desktopNodes);
    }
  }
];
