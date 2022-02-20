'use strict'
const React = require('react')
const importJsx = require('import-jsx');
// const { observer } = require('mobx-react')
const { Box, Text } = require('ink');

const AddFlavour = importJsx('./components/AddFlavour.js')

let setting = {
  "回潮": ["六四回潮"],
  "加料": ["六四加料"]
}

function returnComponent(type, line) {
	if(type === "回潮") {
		return <Text key={line}>{line}</Text>
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
