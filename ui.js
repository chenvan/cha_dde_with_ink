'use strict'

const React = require('react')
const { useEffect, useState } = require('react')
const importJsx = require('import-jsx');
const { Box } = require('ink');

const AddFlavour = importJsx('./components/AddFlavour.js')
const AddWater = importJsx('./components/AddWater.js')
const AddEssence = importJsx('./components/AddEssence.js')
const Dryer = importJsx('./components/Dryer.js')
const { Provider } = importJsx('./components/Provider.js')

let setting = {
	"prod": {
		"回潮": ["六四回潮", "九六回潮"],
		"加料": ["六四加料", "九六加料"],
		"加香": ["六四加香"]
	},
	"dev": {
		"回潮": [],
		"加料": [],
		"烘丝": ["六四烘丝"],
		"加香": []
	},
	"64": {
		"回潮": ["六四回潮"],
		"加料": ["六四加料"],
		// "烘丝": ["六四烘丝"],
		"加香": ["六四加香"]
	}
}

function returnComponent(type, line) {
	if(type === "回潮") {
		return <Provider key={line} line={line} ><AddWater /></Provider>
	}else if(type === "加料") {
		return <Provider key={line} line={line} ><AddFlavour /></Provider>
	}else if(type === "加香") {
		return <Provider key={line} line={line} ><AddEssence /></Provider>
	}else if(type === "烘丝") {
		return <Provider key={line} line={line}><Dryer /></Provider>
	}
}

function splitToChunks(array, rows) {
	let result = []

	for(let i = rows; i > 0; i--) {
		result.push(array.splice(0, Math.ceil(array.length / i)))
	}

	return result
}



const App = ({unit}) => {

	const [displayComp, setDisplayComp] = useState([])

	useEffect(() => {
    	let temp = Object.keys(setting[unit]).reduce((displayComp, type) => {
        	return displayComp.concat(setting[unit][type].map(line => returnComponent(type, line)))
    	}, [])
	
    	setDisplayComp(splitToChunks(temp, 3))

	}, [])

	return (
		// <Box key="root" flexDirection='column' width="100%">
		// 	{
		// 		Object.keys(setting[unit]).map(type => {
		// 			return <Box key={type} flexDirection='row' width="100%">{
		// 				setting[unit][type].map(line => returnComponent(type, line))
		// 			}</Box>
		// 		})
		// 	}
		// </Box>
		<Box key="root" flexDirection='column' width="100%">
			{
				displayComp.map((comps, index) => {
					return (
						<Box key={'row'+index} flexDirection='row' width="100%">
							{
								comps.map(comp => comp)
							}
						</Box>
					)
				})
			}
		</Box>
	)
}

module.exports = App
