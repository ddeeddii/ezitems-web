import item_gfxs from '../../data/item_gfxs.json' with {type: 'json'}
import trinket_gfxs from '../../data/trinket_gfxs.json' with {type: 'json'}

import { Item } from "./classes.js"
import { ItemType, files } from "./core.js"
import { getItemTrinketLines } from './functions.js'
import { addToItemTable } from './item_table.js'

// == Helper function specific to this file
function getKeyByValue(object, value) {
	return Object.keys(object).find((key) => object[key] == value)
}

let currentParsedZip = []

// Note
// This is my first time working with async code
// Proceed with caution
function readLua(zip, path) {
	return new Promise((resolve, reject) => {
		zip.files[path].async('string').then(function (fileData) {
			const lua = {
				name: 'main.lua',
				type: 'lua',
				content: fileData,
			}

			resolve(lua)
		})
	})
}

function readPng(zip, path) {
	return new Promise((resolve, reject) => {
		zip.files[path].async('arraybuffer').then(function (fileData) {
			const buffer = new Uint8Array(fileData)
			const blob = new Blob([buffer.buffer])

			const filename = path.replace(/^.*[\\\/]/, '')

			const img = {
				name: filename,
				type: 'gfx',
				content: blob,
			}

			resolve(img)
		})
	})
}

async function getZipContents(userZip) {
	JSZip.loadAsync(userZip).then(async (zip) => {
		for (const path of Object.keys(zip.files)) {
			const extension = path.split('.').pop()

			if (extension == 'lua') {
				const lua = await readLua(zip, path)
				currentParsedZip.push(lua)
			} else if (extension == 'png') {
				const img = await readPng(zip, path)
				currentParsedZip.push(img)
			}
		}
		appendItemsFromZip()
	})
}

function getZipLua() {
	for (const obj of currentParsedZip) {
		const type = obj.type

		if (type == 'lua') {
			return obj
		}
	}
}

let pseudoItems = {
	1: [],
	2: [],
}

const parseLineRe = /{|}|"/g
function parseItemLine(line, type) {
	if (line == '' || line == '}') {
		return
	}

	// Slice removes the last comma, which would mess with the split
	line = line.replace(parseLineRe, '').slice(0, -1)

	const lineContent = line.split(', ')

	// Remove the first character, which is always empty space
	lineContent[0] = lineContent[0].substring(2)

	pseudoItems[type][lineContent[0]] = {
		id: lineContent[0],
		name: lineContent[1],
		desc: lineContent[2],
		sprite: {
			img: undefined,
			name: undefined,
		},
	}
}

function parseExistingLua(lua) {
	const luaContent = lua.content

	const [itemLine, trinketLine] = getItemTrinketLines(luaContent)

	const lines = luaContent.split('\n')

	const itemEnd = lines.indexOf('}') + 1
	const trinketEnd = lines.indexOf('}', itemEnd) + 1

	// Parse Items
	for (let currentLine = itemLine; currentLine < itemEnd; currentLine++) {
		parseItemLine(lines[currentLine], ItemType.Item)
	}

	// Parse Trinkets
	for (
		let currentLine = trinketLine;
		currentLine < trinketEnd;
		currentLine++
	) {
		parseItemLine(lines[currentLine], ItemType.Trinket)
	}
}

function getItemInfoFromGfx(name) {
	const itemAttempt = getKeyByValue(item_gfxs, name)
	const trinketAttempt = getKeyByValue(trinket_gfxs, name)

	if (itemAttempt == undefined && trinketAttempt == undefined) {
		return [undefined, undefined]
	} else if (itemAttempt != undefined) {
		return [ItemType.Item, itemAttempt]
	} else {
		return [ItemType.Trinket, trinketAttempt]
	}
}

function appendItemsFromZip() {
	const lua = getZipLua()

	// Parse Lua
	if (lua != undefined) {
		parseExistingLua(lua)
	}

	// Parse Images
	currentParsedZip.forEach((obj) => {
		const objType = obj.type
		if (objType != 'gfx') {
			return
		}

		const objName = obj.name
		const [objItemType, objItemId] = getItemInfoFromGfx(objName)

		if (objItemType == undefined && objItemId == undefined) {
			alert(
				`Sprite name ${objName} is not a item nor a trinket name!\nThe sprite will be ignored.`
			)
			return
		}

		let isEmpty = false

		try {
			pseudoItems[objItemType][objItemId]['sprite'] = {}
		} catch (e) {
			isEmpty = true
		}

		const file = new File([obj.content], 'sprite.png')

		if (!isEmpty) {
			const itemMatch = pseudoItems[objItemType][objItemId]

			itemMatch['sprite'] = {
				img: file,
				name: objName,
			}
		} else {
			pseudoItems[objItemType][objItemId] = {
				id: objItemId,
				name: undefined,
				desc: undefined,
				sprite: {
					img: file,
					name: objName,
				},
			}
		}
	})

	// All defined items are now in pseudoItems
	// Add all items into files and into the table
	for (const [type, rootObj] of Object.entries(pseudoItems)) {
		for (const [_, obj] of Object.entries(rootObj)) {
			const name = obj['name']
			const desc = obj['desc']

			const sprite = obj['sprite']

			const item = new Item(obj.id, parseInt(type))

			if (name == undefined && desc == undefined) {
				// Only sprite
                item.addSprite(sprite['img'], sprite['name'])

			} else if ( sprite['img'] == undefined && sprite['name'] == undefined) {
				// Only name/desc
                item.addAttributes(name, desc)

			} else {
				// All combined
                item.addSprite(sprite['img'], sprite['name'])
                item.addAttributes(name, desc)
			}

			const idx = files.push(item) - 1
			addToItemTable(idx)
		}
	}
    // end todo
}

// Get the zip
$(document).ready(() => {
	$('#uploadExisting').click(() => {
		const existingModInput = document.createElement('input')
		existingModInput.type = 'file'
		existingModInput.accept = '.zip'
		existingModInput.click()

		existingModInput.onchange = () => {
			// Reset vars
			currentParsedZip = []
			pseudoItems = {
				1: [],
				2: [],
			}

			const userZip = existingModInput.files[0]
			getZipContents(userZip)
		}
	})
})
