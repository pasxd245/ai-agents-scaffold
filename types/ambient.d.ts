declare module '@nci-gis/js-tmpl' {
  export interface RenderDirectoryConfig {
    templateDir: string;
    outDir: string;
    extname: string;
    view: Record<string, unknown>;
    partialsDir?: string;
  }

  export function renderDirectory(config: RenderDirectoryConfig): Promise<void>;
}
