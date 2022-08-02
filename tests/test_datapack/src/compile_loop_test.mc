function bar {
	LOOP (10, i) {
		say <%i%>
	}
	LOOP (['apple','steak'], food) {
		give @a <%food%> 1
	}
	LOOP ('abcdefg', letter) {
		say <%letter%>0 <%letter.length%>
	}

	LOOP (10, i)
	{
		say <%i%>
	}
}
