export interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

export interface RegistryItem {
  $schema?: string;
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
  meta: {
    id: string;
    category: string;
    tags: string[];
    frameworks: string[];
    assets: string[];
    installation: string;
    reducedMotion: string;
    license: string;
  };
}

export interface Registry {
  $schema?: string;
  name: string;
  homepage: string;
  items: RegistryItem[];
}

export const repositoryRoot: string;
export function isSafeRelativePath(path: unknown): path is string;
export function resolveRegistryFile(root: string, path: string): Promise<string>;
export function readRegistry(root?: string): Promise<{ registry: Registry; registryPath: string }>;
export function validateRegistry(root?: string): Promise<string[]>;
