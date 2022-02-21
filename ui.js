'use strict'

const React = require('react')
const importJsx = require('import-jsx');
const { Box } = require('ink');

const AddFlavour = importJsx('./components/AddFlavour.js')
const AddWater = importJsx('./components/AddWater.js')

let setting = {
  "回潮": ["六四回潮"],
  "加料": ["六四加料"]
}

function returnComponent(type, line) {
	if(type === "回潮") {
		return <AddWater line={line} />
	}else if(type === "加料") {
		return <AddFlavour line={line} />
	}
}

const App = () => (
	<Box key="root" flexDirection='column'>{
		Object.keys(setting).map(type => {
			return <Box key={type} flexDirection='row'>{
				setting[type].map(line => returnComponent(type, line))
			}</Box>
		})
		}
	</Box>
)

module.exports = App
