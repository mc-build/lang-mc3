import * as vfs from './virtualFileSystem'
import * as fs from 'fs'
import { Parser } from './parser'

const testOutputPath = '.tests/'

async function main() {
	if (!fs.existsSync(testOutputPath)) await fs.promises.mkdir(testOutputPath, { recursive: true })
	const src = await vfs.mapFolder('tests/test_datapack', {
		exclude: /^\./,
	})
	await fs.promises.writeFile(testOutputPath + 'test_datapack.json', JSON.stringify(src, null, '\t'))
	const mcFiles = src.getFiles(/.+\.mc$/, true)
	const parsed: any[] = []

	for (const file of mcFiles) {
		try {
			parsed.push(new Parser(file!.content).parse())
		} catch (e: any) {
			if (e.name === 'LangMCSyntaxError') {
				throw new SyntaxError(
					`Failed to parse ${file!.getPath()}\n${e.message}\n${e.stack.replace(e.message, '')}`
				)
			}
			throw e
		}
	}

	await fs.promises.writeFile(testOutputPath + 'test_datapack_parsed.json', JSON.stringify(parsed, null, '\t'))
}

main()
