declare module '@nci-gis/js-tmpl' {
  export interface RenderDirectoryConfig {
    templateDir: string;
    outDir: string;
    extname: string;
    view: Record<string, unknown>;
    partialsDir?: string;
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
  }

  export function renderDirectory(config: RenderDirectoryConfig): Promise<void>;
  export function resolveConfig(
    cli: ResolveConfigInput,
    cwd?: string
  ): RenderDirectoryConfig;
}
