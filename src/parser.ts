import { Stream } from './stream'
import { throwSyntaxError } from './syntaxError'
import { genComparison as comp } from './util'

type TokenType =
	| 'dir'
	| 'function'
	| 'command'
	| 'clock'
	| 'functionBlock'
	| 'compileIf'
	| 'compileLoop'
	| 'jsBlock'
	| 'executeRunBlock'

interface IToken {
	type: TokenType
	line: number
	column: number
}

interface ITokenDir extends IToken {
	type: 'dir'
	name: string
	content: IToken[]
}

interface ITokenFunction extends IToken {
	type: 'function'
	name: string
	content: IToken[]
}

interface ITokenFunctionBlock extends IToken {
	type: 'functionBlock'
	name?: string
	content: IToken[]
}

interface ITokenClock extends IToken {
	type: 'clock'
	name?: string
	clockRate: string
	content: IToken[]
}

interface ITokenCompileIf extends IToken {
	type: 'compileIf'
	condition: string
	content: IToken[]
	elseContent?: IToken[]
}

interface ITokenCompileLoop extends IToken {
	type: 'compileLoop'
	condition: string
	variableName: string
	content: IToken[]
}

interface IJsBlockToken extends IToken {
	type: 'jsBlock'
	content: string
}

interface ITokenExecuteRunBlock extends IToken {
	type: 'executeRunBlock'
	args: string
	functionName?: string
	content?: IToken[] | ITokenFunctionBlock
}

interface ITokenCommand extends IToken {
	type: 'command'
	name: string
	args: string
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz'
const numbers = '0123456789'

const CHAR = {
	WHITESPACE: comp(' \t\r\n'),
	NEWLINE: comp('\n\r'),
	DIGIT: comp(numbers),
	WORD: comp(`${alphabet}${numbers}_`),
}

export class Parser {
	public s: Stream
	public depth: number
	constructor(public code: string) {
		this.s = new Stream(code)
		this.depth = 0
	}
	parse() {
		return this.parseDirContext()
	}

	parseGlobalContext(parentContext: () => IToken[]) {
		if (this.s.look(0, 2) === 'IF') {
			return this.parseCompileIf(parentContext)
		} else if (this.s.look(0, 4) === 'LOOP') {
			return this.parseCompileLoop(parentContext)
		} else if (this.s.look(0, 3) === '<%%') {
			return this.collectJsBlock()
		} else {
			throwSyntaxError(this.s, `Unexpected '${this.s.item}'`)
		}
	}

	parseDirContext() {
		const tokens: IToken[] = []

		this.consumeWhitespace()
		while (this.s.item) {
			if (this.s.item === '}') {
				this.s.consume()
				break
			} else if (this.s.look(0, 3) === 'dir') {
				tokens.push(this.parseDir())
			} else if (this.s.look(0, 8) === 'function') {
				tokens.push(this.parseFunction())
			} else if (this.s.look(0, 5) === 'clock') {
				tokens.push(this.parseClock())
			} else tokens.push(this.parseGlobalContext(() => this.parseDirContext()))

			this.consumeWhitespace()
		}

		return tokens
	}

	parseFunctionContext() {
		const tokens: IToken[] = []

		this.consumeWhitespace()
		while (this.s.item) {
			if (this.s.item === '}') {
				this.s.consume()
				if (this.depth === 0) {
					throwSyntaxError(this.s, `Unexpected '}'`)
				}
				break
			} else if (this.s.item === '{') {
				tokens.push(this.parseFunctionBlock())
			} else if (this.s.look(0, 5) === 'block') {
				tokens.push(this.parseFunctionBlock(true))
			} else if (this.s.look(0, 7) === 'execute') {
				tokens.push(this.parseExecuteCommand())
			} else if (CHAR.WORD(this.s.item)) {
				tokens.push(this.parseCommand())
			} else tokens.push(this.parseGlobalContext(() => this.parseFunctionContext()))

			this.consumeWhitespace()
		}

		return tokens
	}

	consumeWhitespace() {
		this.s.consumeWhile(s => s.item && CHAR.WHITESPACE(s.item))
	}

	consumeSpaces() {
		this.s.consumeWhile(s => s.item === ' ')
	}

	expect(char: string) {
		if (this.s.item !== char) {
			throwSyntaxError(this.s, `Expected '${char}'`)
		}
		this.s.consume()
	}

	expectEOL() {
		if (!CHAR.NEWLINE(this.s.item)) {
			throwSyntaxError(this.s, `Expected EOL`)
		}
		this.s.consumeWhile(s => s.item && CHAR.NEWLINE(s.item))
	}

	collectJsInjector() {
		this.s.consume(2)
		let block = '${'
		while (this.s.item) {
			if (this.s.look(0, 2) === '%>') {
				this.s.consume(2)
				return block + '}'
			} else if (CHAR.NEWLINE(this.s.item)) {
				throwSyntaxError(this.s, `Expected closing bracket '%>' for js injector`)
			} else {
				block += this.s.item
				this.s.consume()
			}
		}
	}

	collectJsBlock() {
		const { line, column } = this.s
		this.s.consume(3)
		let content = ''
		while (this.s.item) {
			if (this.s.look(0, 3) === '%%>') {
				this.s.consume(3)
				const token: IJsBlockToken = {
					type: 'jsBlock',
					content,
					line,
					column,
				}
				return token
			} else if (this.s.look(0, 3) === '<%%') {
				throwSyntaxError(this.s, `Expected closing bracket '%%>' for js block`)
			} else {
				content += this.s.item
				this.s.consume()
			}
		}
		throwSyntaxError(this.s, `Expected closing bracket '%%>' for js block`)
	}

	collectWord() {
		let word = ''
		while (this.s.item) {
			if (CHAR.WORD(this.s.item)) {
				word += this.s.item
				this.s.consume()
			} else if (this.s.look(0, 2) === '<%') {
				word += this.collectJsInjector()
			} else if (CHAR.WHITESPACE(this.s.item) || CHAR.NEWLINE(this.s.item)) {
				break
			} else {
				throwSyntaxError(this.s, `Unexpected '${this.s.item}' while parsing word`)
			}
		}
		return word
	}

	parseDir() {
		const { line, column } = this.s
		this.s.consume(3)
		this.expect(' ')
		const name = this.collectWord()
		this.consumeWhitespace()
		this.expect('{')
		this.consumeSpaces()
		this.expectEOL()
		this.depth++
		const tokens = this.parseDirContext()
		this.depth--

		const token: ITokenDir = {
			type: 'dir',
			name,
			content: tokens,
			line,
			column,
		}
		return token
	}

	parseFunction() {
		const { line, column } = this.s
		this.s.consume(8)
		this.expect(' ')
		const name = this.collectWord()
		this.consumeWhitespace()
		this.expect('{')
		this.consumeSpaces()
		this.expectEOL()
		this.depth++
		const tokens = this.parseFunctionContext()
		this.depth--

		const token: ITokenFunction = {
			type: 'function',
			name,
			content: tokens,
			line,
			column,
		}
		return token
	}

	parseFunctionBlock(keyword?: boolean) {
		const { line, column } = this.s
		this.s.consume() // Consume 1 char early to account for the '{' without having an extra else
		let name: string | undefined
		if (keyword) {
			this.s.consume(4)
			this.consumeWhitespace()
			if (CHAR.WORD(this.s.item)) {
				name = this.collectWord()
				this.consumeWhitespace()
			}
			this.expect('{')
		}
		this.consumeSpaces()
		this.expectEOL()
		this.depth++
		const tokens = this.parseFunctionContext()
		this.depth--
		const token: ITokenFunctionBlock = {
			type: 'functionBlock',
			name,
			content: tokens,
			line,
			column,
		}
		return token
	}

	parseClock() {
		const { line, column } = this.s
		this.s.consume(5)
		this.expect(' ')
		const clockRate = this.collectWord()
		let name: string | undefined
		if (CHAR.WORD(this.s.look(1, 1))) {
			this.expect(' ')
			name = this.collectWord()
		}
		this.consumeWhitespace()
		this.expect('{')
		this.consumeSpaces()
		this.expectEOL()
		this.depth++
		const tokens = this.parseFunctionContext()
		this.depth--
		const token: ITokenClock = {
			type: 'clock',
			name,
			content: tokens,
			clockRate,
			line,
			column,
		}
		return token
	}

	collectCondition() {
		let condition = this.s.item!
		this.s.consume()
		while (this.s.item) {
			if (this.s.item === '(') {
				condition += this.collectCondition()
			} else if (this.s.item === ')') {
				break
			}
			condition += this.s.item
			this.s.consume()
		}
		return condition
	}

	parseCompileIf(contextFunc: () => IToken[]) {
		const { line, column } = this.s
		this.s.consume(2)
		this.consumeWhitespace()
		this.expect('(')
		const condition = this.collectCondition()
		this.expect(')')
		this.consumeWhitespace()
		this.expect('{')
		this.consumeSpaces()
		this.expectEOL()
		this.depth++
		const tokens = contextFunc()
		this.depth--
		this.consumeSpaces()
		let elseContent: IToken[] | undefined
		if (this.s.look(0, 4) === 'ELSE') {
			this.s.consume(4)
			this.consumeWhitespace()
			this.expect('{')
			this.consumeSpaces()
			this.expectEOL()
			this.depth++
			elseContent = contextFunc()
			this.depth--
		}

		const token: ITokenCompileIf = {
			type: 'compileIf',
			condition,
			content: tokens,
			elseContent,
			line,
			column,
		}
		return token
	}

	parseCompileLoop(contextFunc: () => IToken[]) {
		const { line, column } = this.s
		this.s.consume(4)
		this.consumeWhitespace()
		this.expect('(')
		let inputs = this.collectCondition()
		this.expect(')')
		const commaIndex = inputs.lastIndexOf(',')
		const condition = inputs.slice(0, commaIndex)
		const variableName = inputs.slice(commaIndex + 1).trim()
		this.consumeWhitespace()
		this.expect('{')
		this.consumeSpaces()
		this.expectEOL()
		this.depth++
		const tokens = contextFunc()
		this.depth--
		this.consumeSpaces()

		const token: ITokenCompileLoop = {
			type: 'compileLoop',
			condition,
			variableName,
			content: tokens,
			line,
			column,
		}
		return token
	}

	parseCommand() {
		const { line, column } = this.s
		try {
			const name = this.collectWord()
			this.consumeSpaces()
			let content = ''
			while (this.s.item) {
				if (this.s.look(0, 2) === '<%') {
					content += this.collectJsInjector()
				} else if (!CHAR.NEWLINE(this.s.item)) {
					content += this.s.item
					this.s.consume()
				} else {
					break
				}
			}
			this.expectEOL()

			const token: ITokenCommand = {
				type: 'command',
				name,
				args: content,
				line,
				column,
			}
			return token
		} catch (e: any) {
			throw new SyntaxError(`Failed to parse command at ${line}:${column}: ${e.message}`)
		}
	}

	parseExecuteCommand() {
		const { line, column } = this.s
		let content = ''
		let token: ITokenCommand | ITokenExecuteRunBlock

		this.s.consume(7)
		this.expect(' ')

		while (this.s.item) {
			if (this.s.look(0, 2) === '<%') {
				content += this.collectJsInjector()
			} else if (!CHAR.NEWLINE(this.s.item)) {
				content += this.s.item
				this.s.consume()
			} else {
				break
			}
		}
		console.log(content)
	}
}
