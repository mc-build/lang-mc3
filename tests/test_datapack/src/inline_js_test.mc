function bar<%'_baz'%> {
	say <%'Hello World!'%>
}

LOOP(10, i) {
	function <%i%>_frame {
		say <%'Hello World!'%>
	}
}
