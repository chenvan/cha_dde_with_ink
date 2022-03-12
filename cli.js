#!/usr/bin/env node
'use strict'

const React = require('react')
const importJsx = require('import-jsx')
const {render} = require('ink')
const meow = require('meow')

const ui = importJsx('./ui')

const cli = meow({
	flags: {
		unit: {
			type: "string",
			default: "all"
		}
	}
})



const main = async () => {
	const app = render(React.createElement(ui, cli.flags))

	await app.waitUntilExit()
}

main()
