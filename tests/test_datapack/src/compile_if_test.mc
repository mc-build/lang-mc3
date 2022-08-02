function foo {
	IF (config.dev) {
		say I only exist if devmode is on!
	}
	IF (config.dev) {
		say Devmode on!
	} ELSE {
		say Devmode off!
	}

	IF (config.my_func(['Blasphemy!', 'Hooligans!'])) {
		say I only exist if devmode is on!
	}
}