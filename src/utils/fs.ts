import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function writeTextFile(filePath: string, data: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, data, 'utf8');
}

export async function emptyDir(dirPath: string): Promise<void> {
  await rm(dirPath, { recursive: true, force: true });
  await ensureDir(dirPath);
}

export async function removePath(targetPath: string): Promise<void> {
  await rm(targetPath, { recursive: true, force: true });
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function copyPath(sourcePath: string, targetPath: string): Promise<void> {
  await ensureDir(path.dirname(targetPath));
  await copyFile(sourcePath, targetPath);
}
