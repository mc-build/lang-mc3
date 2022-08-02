
function block_moment {
	{
		say hello world!
	}
	block {
		say hello world!
	}
	block
	{
		say hello world!
	}
	block hello_world {
		say hello world!
	}
	block hello_world
	{
		say hello world!
	}
}

function recursion_test {
	{
		block {
			say hello world!
			block bottom_moment {
				say hello world!
			}
		}
		say hello world!
	}
}
