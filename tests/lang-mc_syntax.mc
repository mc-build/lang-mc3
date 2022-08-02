
dir dir_example {
	function function_example {
		say Function contents
	}
}

function block_examples {
	say Function contents
	{
		say Keywordless block contents
	}

	block {
		say Keyword block contents
	}

	block my_block {
		say Named block contents
	}

	execute if score # v matches 1 run {
		say Keywordless block contents
	}

	execute if score # v matches 1 run block {
		say Keyword block contents
	}

	execute if score # v matches 1 run block my_block2 {
		say Named block contents
	}
}

dir clock_examples {
	clock 1t {
		say Clock contents
	}

	clock 1s my_clock {
		say Named clock contents
	}
}

function compile_if_example {
	IF (config.dev) {
		say I only exist if devmode is on!
	}
	IF (config.dev) {
		say Devmode on!
	} ELSE {
		say Devmode off!
	}
}

function compile_loop_example {
	LOOP (10, i) {
		say <%i%>
	}
	LOOP (['apple','steak'], food) {
		give @a <%food%> 1
	}
	LOOP ('abcdefg', letter) {
		say <%letter%>
	}
}

function mutliline_command_example {
	| execute
		if score @s # v matches 1..
		if block 0 0 0 stone
		say Hello from a multi-line command!
	say Hello from the command following a multi-line command
}

function inline_js_example {
	say <%config.hello_world%>
}

function multiline_js_example {
	<%%
		for (let i=0;i<10;i++) {
			emit(`say ${i}`)
		}
	%%>
}

function execute_if_else_example {
	execute if score # v matches 1 run {
		say a
	} else execute if score # v matches 2 run {
		say b
	} else {
		say c
	}
}

function while_example {
	execute while if score # v matches 1 every 1s run {
		say I'll say this every second while the condition is true
	}
	# If every subcommand is not specified, it check the condition every tick
	execute while if score # v matches 1 run {
		say I'll say this every tick while the condition is true
	}
}

