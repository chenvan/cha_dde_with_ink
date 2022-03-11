#!/usr/bin/env node
'use strict'

const React = require('react')
const importJsx = require('import-jsx')
const {render} = require('ink')
const meow = require('meow')

const ui = importJsx('./ui')

const cli = meow(`
	Usage
	  $ cha_dde_with_ink

	Options
		--unit all
		--unit dev
		--unit test

	Examples
	  $ cha_dde_with_ink --unit prod
	  $ cha_dde_with_ink --unit dev
	  $ cha_dde_with_ink --unit test
`, {
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
