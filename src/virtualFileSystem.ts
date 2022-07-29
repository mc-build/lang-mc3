import * as fs from 'fs'
import * as pathjs from 'path'

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
	toJSON(): any {
		return {
			name: this.name,
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
	getFiles(name?: string | RegExp, recursive?: boolean) {
		const children: (VirtualFile | VirtualFolder)[] = []
		for (const child of this.children) {
			if (child instanceof VirtualFile) {
				// If the file's name matches the string or regexp, add it to the list
				if ((name instanceof RegExp && name.test(child.name)) || child.name === name) {
					children.push(child)
				}
			} else if (recursive) {
				children.push(...child.getFiles(name, recursive))
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
