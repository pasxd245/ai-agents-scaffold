// Hand-written surface of @nci-gis/js-tmpl, which ships no declarations.
// Kept to what this package calls; matches 0.2.0.
declare module '@nci-gis/js-tmpl' {
  export interface RenderDirectoryConfig {
    templateDir: string;
    outDir: string;
    extname: string;
    view: Record<string, unknown>;
    partialsDir?: string;
    targetFs?: 'portable' | 'case-sensitive';
  }

  export interface ResolveConfigInput {
    templateDir: string;
    outDir: string;
    extname?: string;
    valuesFile?: string;
    valuesDir?: string;
    partialsDir?: string;
    configFile?: string;
    envKeys?: string[];
    envPrefix?: string;
    targetFs?: 'portable' | 'case-sensitive';
  }

  /** One file a render would write. Paths are `/`-separated on every OS. */
  export interface PlanEntry {
    relPath: string;
    target: string;
    content: string;
  }

  export class JsTmplError extends Error {
    code: string;
    hint?: string;
    details?: Record<string, unknown>;
  }

  export const ErrorCodes: Readonly<Record<string, string>>;

  export function renderDirectory(config: RenderDirectoryConfig): Promise<void>;
  export function planRender(
    config: RenderDirectoryConfig
  ): Promise<PlanEntry[]>;
  export function comparePlan(
    plan: PlanEntry[],
    outDir: string
  ): { added: string[]; changed: string[] };
  export function resolveConfig(
    cli: ResolveConfigInput,
    cwd?: string
  ): RenderDirectoryConfig;
  export function findProjectConfig(cwd?: string): string | null;
}
