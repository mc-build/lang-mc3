function bar<%'_baz'%> {
	<%%
		console.log('Hello World!')
		for (let i=0;i<10;i++) {
			emit(`scoreboard players set @s v ${i}`)
		}
	%%>
	<%%emit('say Greetings from a inline-multiline JS block z:o')%%>
}

LOOP(10, i) {
	function <%i%>_frame {
		say <%'Hello World!'%>
	}
}
