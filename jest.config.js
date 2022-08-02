/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	watchPathIgnorePatterns: [
		'/node_modules/',
		'/dist/',
		'/.tests/',
		'/tests/virtualizeTest/',
		'/tests/test_datapack/',
	],
}
