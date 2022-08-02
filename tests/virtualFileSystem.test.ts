import * as vfs from '../src/virtualFileSystem'
import * as fs from 'fs'

const testOutputPath = '.tests/'

describe('virtualFileSystem', () => {
	let src: vfs.VirtualFolder
	beforeAll(async () => {
		if (fs.existsSync(testOutputPath)) await fs.promises.rm(testOutputPath, { recursive: true })
		await fs.promises.mkdir(testOutputPath, { recursive: true })

		src = await vfs.mapFolder('tests/virtualizeTest', {
			exclude: /^\./,
		})
		await fs.promises.writeFile(testOutputPath + 'virtualizeTest.json', JSON.stringify(src, null, '\t'))
	})

	it('should virtualize folders and files', () => {
		expect(src.getChild('folder_a')).toBeInstanceOf(vfs.VirtualFolder)
		const files = src.getFiles(undefined, true)
		expect(files.length).toBe(4)
		const folders = src.getFolders(undefined, true)
		expect(folders.length).toBe(3)
	})

	it('should find and parse JSON files', () => {
		const files = src.getFiles(/.+\.json/, true)
		expect(files.length).toBe(2)
		for (const file of files) {
			expect(file.parseJSON()).toBeInstanceOf(Object)
		}
	})

	it('should find and parse YAML files', () => {
		const files = src.getFiles(/.+\.yml/, true)
		expect(files.length).toBe(2)
		for (const file of files) {
			expect(file.parseYAML()).toBeInstanceOf(Object)
		}
	})
})
