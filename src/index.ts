import { parser as vanillaParser, tokenizer as vanillaTokenizer } from 'minecraft-java-command-parser'
import { StringStream } from 'generic-stream'

const tokens = vanillaTokenizer.tokenize(new StringStream('say hello World!'))
vanillaParser.parse(tokens)
