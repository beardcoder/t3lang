import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { ScannedFile } from './project';

export function scanProject(root: string): Promise<ScannedFile[]> {
	return invoke<ScannedFile[]>('scan_project', { root });
}

export function readTextFile(path: string): Promise<string> {
	return invoke<string>('read_text_file', { path });
}

export function writeTextFile(path: string, contents: string): Promise<void> {
	return invoke('write_text_file', { path, contents });
}

export function fileExists(path: string): Promise<boolean> {
	return invoke<boolean>('file_exists', { path });
}

/** Move files to the system trash. Missing paths are skipped. */
export function trashPaths(paths: string[]): Promise<void> {
	return invoke('trash_paths', { paths });
}

/** Reveal a file in Finder / Explorer. */
export async function revealInDir(path: string): Promise<void> {
	const { revealItemInDir } = await import('@tauri-apps/plugin-opener');
	await revealItemInDir(path);
}

/** Native yes/no confirmation dialog. */
export async function confirmDialog(message: string, title: string): Promise<boolean> {
	const { ask } = await import('@tauri-apps/plugin-dialog');
	return ask(message, { title, kind: 'warning' });
}

/** Project folder/file the app was launched with on the command line, if any. */
export function initialProject(): Promise<string | null> {
	return invoke<string | null>('initial_project');
}

/** Install a `t3lang` command on PATH; resolves to the installed path. */
export function installCli(): Promise<string> {
	return invoke<string>('install_cli');
}

/** Native folder picker. Returns absolute path or null if cancelled. */
export async function pickDirectory(title = 'Open project folder'): Promise<string | null> {
	const result = await open({ directory: true, multiple: false, title });
	return typeof result === 'string' ? result : null;
}

/** Native file picker for a single XLIFF file. */
export async function pickXliffFile(): Promise<string | null> {
	const result = await open({
		directory: false,
		multiple: false,
		title: 'Open XLIFF file',
		filters: [{ name: 'XLIFF', extensions: ['xlf', 'xliff'] }]
	});
	return typeof result === 'string' ? result : null;
}
