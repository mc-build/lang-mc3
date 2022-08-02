interface Line {
	number: number
	startIndex: number
}

/**
 * A simple text stream class.
 * Useful for language parsing
 */
export class Stream {
	string: string
	index: number
	item?: string
	line: number
	lineStart: number
	column: number
	length: number
	lines: Line[]

	constructor(str: string) {
		this.string = str
		this.index = -1
		this.line = 1
		this.lineStart = 0
		this.column = 0
		this.length = str.length
		this.lines = [{ number: 1, startIndex: 0 }]
		this.consume()
	}

	/**
	 * Returns the next character in the stream.

	 * Does not consume
	 */
	next() {
		return this.string.at(this.index + 1)
	}

	/**
	 * Returns a string slice of the stream relative to the current item

	 * Does not consume
	 * @param start Where to start the slice relative to the current index
	 * @param end How many characters after the start to collect. Defaults to 0
	 */
	look(start: number, end: number = 1) {
		return this.string.slice(this.index + start, this.index + start + end)
	}

	/**
	 * Returns a string slice of the stream.

	 * Does not consume
	 * @param start Start index of the slice
	 * @param end End index of the slice
	 */
	slice(start: number, end: number = 1) {
		return this.string.slice(start, end)
	}

	/**
	 * Returns a string consisting of all consecutive characters in the stream from the current index that match the condition.

	 * Does Consume
	 * @param condition
	 * @returns
	 */
	collect(condition: (stream: Stream) => any) {
		let str = ''
		while (this.item && condition(this)) {
			str += this.item
			this.consume()
		}
		return str
	}

	/**
	 * Returns the index of the provided character in the stream

	 * Does not consume
	 * @param char The character to search for
	 * @returns The index of the character if found. Otherwise false
	 */
	seek(char: string, max?: number): number | undefined {
		if (max) max = this.index + max
		else max = this.string.length
		for (let i = this.index; i < max; i++) {
			const c = this.string.at(i)
			if (c && c === char) return i
		}
		return
	}

	/**
	 * Returns the stream index of the line specified
	 * @param lineNumber The ID of the line
	 */
	lineNumberToIndex(lineNumber: number) {
		const line = this.lines.find(l => l.number === lineNumber)
		if (!line) throw new Error(`Tried to access line ${lineNumber} before stream reached it.`)
		return line.startIndex
	}

	/**
	 * Returns a value of 0 - 1 based on how much of the stream has been consumed
	 */
	getProgress() {
		return Math.min(this.index / this.string.length, 1)
	}

	consumeWhile(condition: (stream: Stream) => any) {
		while (this.item && condition(this)) this.consume()
	}

	/**
	 * Consumes the next character(s) in the stream
	 * @param n How many caracters to consume
	 */
	consume(n = 1) {
		this.item = this.string.at(this.index + n)
		this.column += n
		this.index += n
		if (this.item === '\n') {
			this.line += n
			this.lineStart = this.index + 1
			this.lines.push({ number: this.line, startIndex: this.lineStart })
			this.column = 0
		}
	}
}
