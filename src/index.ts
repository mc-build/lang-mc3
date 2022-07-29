import * as vfs from './virtualFileSystem'
import * as fs from 'fs'

const testOutputPath = '.tests/'

async function main() {
	if (!fs.existsSync(testOutputPath)) await fs.promises.mkdir(testOutputPath, { recursive: true })
	const src = await vfs.mapFolder('tests/test_datapack', {
		exclude: /^\./,
	})
	await fs.promises.writeFile(testOutputPath + 'test_datapack.json', JSON.stringify(src, null, '\t'))
	const mcFiles = src.getFiles(/.+\.mc$/, true)
	console.log(mcFiles)
}

main()
