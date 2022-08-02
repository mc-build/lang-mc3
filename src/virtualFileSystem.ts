import * as fs from 'fs'
import * as pathjs from 'path'
import * as YAML from 'js-yaml'

export class VirtualFile {
	public extention?: string
	public parent?: VirtualFolder
	constructor(public name: string, public content: string = '') {
		this.extention = name.split('.').pop()
	}
	getPath(): string {
		if (this.parent) {
			return this.parent.getPath() + '/' + this.name
		}
		return this.name
	}
	parseJSON(): any {
		return JSON.parse(this.content)
	}
	parseYAML(): any {
		return YAML.load(this.content)
	}
	toJSON(): any {
		return {
			name: this.name,
			extention: this.extention,
			path: this.getPath(),
			content: this.content,
		}
	}
}

export class VirtualFolder {
	public parent?: VirtualFolder
	public children: (VirtualFile | VirtualFolder)[] = []
	constructor(public name: string) {}
	getPath(): string {
		if (this.parent) {
			return this.parent.getPath() + '/' + this.name
		}
		return this.name
	}
	addChild(child: VirtualFile | VirtualFolder): void {
		this.children.push(child)
		child.parent = this
	}
	getChild(name: string): VirtualFile | VirtualFolder | undefined {
		return this.children.find(child => child.name === name)
	}
	getFile(name: string | RegExp, recursive?: boolean): VirtualFile | undefined {
		for (const child of this.children) {
			if (child instanceof VirtualFile) {
				if ((name instanceof RegExp && name.test(child.name)) || child.name === name) return child
			} else if (recursive) {
				const file = child.getFile(name, recursive)
				if (file) return file
			}
		}
	}
	getFiles(name?: string | RegExp, recursive?: boolean) {
		const children: VirtualFile[] = []
		for (const child of this.children) {
			if (child instanceof VirtualFile) {
				// If the file's name matches the string or regexp, add it to the list
				if (name === undefined || (name instanceof RegExp && name.test(child.name)) || child.name === name) {
					children.push(child)
				}
			} else if (recursive) {
				children.push(...child.getFiles(name, recursive))
			}
		}
		return children
	}
	getFolder(name: string | RegExp, recursive?: boolean): VirtualFolder | undefined {
		for (const child of this.children) {
			if (child instanceof VirtualFolder) {
				if ((name instanceof RegExp && name.test(child.name)) || child.name === name) return child
				if (recursive) {
					const folder = child.getFolder(name, recursive)
					if (folder) return folder
				}
			}
		}
	}
	getFolders(name?: string | RegExp, recursive?: boolean) {
		const children: VirtualFolder[] = []
		for (const child of this.children) {
			if (child instanceof VirtualFolder) {
				// If the folder's name matches the string or regexp, add it to the list
				if (name === undefined || (name instanceof RegExp && name.test(child.name)) || child.name === name) {
					children.push(child)
				}
				if (recursive) children.push(...child.getFolders(name, recursive))
			}
		}
		return children
	}
	toJSON(): any {
		return {
			name: this.name,
			path: this.getPath(),
			children: this.children.map(child => child.toJSON()),
		}
	}
}

/**
 */
interface mapFolderOptions {
	/**
	 * Any files that match
	 */
	exclude?: RegExp
}

/**
 * Maps the given folder to a VirtualFolder.
 * @param path The path of the folder to map
 */
export async function mapFolder(path: string = '.', options: mapFolderOptions = {}): Promise<VirtualFolder> {
	const name = pathjs.parse(path).name
	const root = new VirtualFolder(name)
	const files = await fs.promises.readdir(path)
	for (const file of files) {
		const filePath = path + '/' + file
		const stats = await fs.promises.stat(filePath)
		if (stats.isDirectory()) {
			root.addChild(await mapFolder(filePath, options))
		} else {
			root.addChild(new VirtualFile(file, await fs.promises.readFile(filePath, 'utf8')))
		}
	}
	return root
}
