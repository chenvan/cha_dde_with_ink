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
		--name  Your name

	Examples
	  $ cha_dde_with_ink --name=Jane
	  Hello, Jane
`)



const main = async () => {
	const app = render(React.createElement(ui, cli.flags))

	await app.waitUntilExit()
}

main()
