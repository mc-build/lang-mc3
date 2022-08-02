
function whizzle {
	execute if score # v matches <%config.test%> {
		say hi
	}
	execute if score # v matches 11 run {
		say hi
	}
	execute if score # v matches 111 run block {
		execute as @a run say hi
	}
	execute if score # v matches 111 run block greetings {
		execute as @a run say hi
	}
	execute run function test:run
}

function if_else {

	execute if score # v matches 2 run {
		say a
	} else execute if score # v matches 22 run {
		say b
	} else run {
		say c
	}

	execute if score # v matches 2 run block {
		say a
	} else execute if score # v matches 22 run block {
		say b
	} else run block {
		say c
	}

	execute if score # v matches 2 run block hello {
		say a
	} else execute if score # v matches 22 run block world {
		say b
	} else run block again {
		say c
	}

}
