import { Item } from './modules/classes.js'
import { gfxs, currentLua, files, ItemType, removedOptions, zip, resetCoreVars } from './modules/core.js'
import { fillItemSelector, getItemTrinketLines } from './modules/functions.js'
import { addToItemTable } from './modules/item_table.js'
import { template } from './modules/template.js'

export let currentType = ItemType.Item
let currentFolderName = ''


// == Helper Function specific to this file

function clearAllInputs() {
	$('#itemId').val('')
	$('#itemName').val('')
	$('#itemDesc').val('')
}

function validateFileName(filename) {
	const re =
		/^[^\s^\x00-\x1f\\?*:"";<>|\/.][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$/

	if (!re.test(filename)) {
		alert('Invalid folder name!')
		return false
	}

	return true
}

function createLua(name) {
	// Sanitize the name
	name = name.replace(/['"]+/g, '').replace(/\\/g, '')

	currentLua.content = template.replace('%NAME%', `"${name}"`)
	$('#modName').prop('readonly', true)
	currentLua.created = true
}

function clearFileInput(input) {
	input.value = ''

	const fileName = document.querySelector('#imageUpload .file-name')
	fileName.textContent = 'No sprite selected'
}

function compileSprites(folderName) {
	const folders = {
		root: undefined,
		item: undefined,
		trinket: undefined,
	}

	for (const item of files) {
		if(item.ignore || !item.hasSprite()) { continue }

		const sprite = item.sprite
		const type = item.type

		// Create root gfx folder if not created already
		if (folders.root == undefined) {
			folders.root = zip
				.folder(folderName)
				.folder('resources')
				.folder('gfx')
				.folder('items')
		}

		// Handle adding the sprites
		if (type == ItemType.Item) {
			if (folders.item == undefined) {
				folders.item = folders.root.folder('collectibles')
			}

			folders.item.file(sprite.name, sprite.img)
		} else if (type == ItemType.Trinket) {
			if (folders.trinket == undefined) {
				folders.trinket = folders.root.folder('trinkets')
			}

			folders.trinket.file(sprite.name, sprite.img)
		}
	}
}

export function appendItemsToLua() {
	for (const item of files) {
		if (item.ignore) {
			continue
		}

		const type = item.type
		const id = item.id

		// After renaming in the table, they arent sanitizied
		// So they are sanitized here again
		const name = item.name.replace(/['"]+/g, '').replace(/\\/g, '')
		const desc = item.desc.replace(/['"]+/g, '').replace(/\\/g, '')

		if (name == '' && desc == '') {
			continue
		}

		const [itemLine, trinketLine] = getItemTrinketLines(currentLua.content)

		const text = `  {${id}, "${name}", "${desc}"},`

		const lines = currentLua.content.split('\n')

		if (type == ItemType.Item) {
			lines.splice(itemLine, 0, text)
		} else if (type == ItemType.Trinket) {
			lines.splice(trinketLine, 0, text)
		}

		currentLua.content = lines.join('\n')
	}
}

// == End helper function

$(document).ready(function () {
	$('#submitBtn').click(function () {
		// Download zip button
		downloadFinishedZip()
	})

	$('#newItemBtn').click(function () {
		// Add item button
		addFile()
	})

	const fileInput = document.querySelector('#imageUpload input[type=file]')
	fileInput.onchange = () => {
		if (fileInput.files.length > 0) {
			const fileName = document.querySelector('#imageUpload .file-name')
			fileName.textContent = fileInput.files[0].name
		}
	}

	// Fill item id selector
	fillItemSelector(ItemType.Item)

	$('#itemType').change(function () {
		$('#itemId option').remove() // Clear the dropdown
		clearAllInputs()

		const option = $('option:selected', this).val()
		if (option == 2) {
			fillItemSelector(ItemType.Trinket)
			currentType = ItemType.Trinket
		} else if (option == 1) {
			fillItemSelector(ItemType.Item)
			currentType = ItemType.Item
		}
	})
})

function addFile() {
	const modName = $('#modName').val()
	if (modName == '') {
		alert('No mod name!')
		return
	}

	const folderName = $('#folderName').val()
	if (folderName == '') {
		alert('No folder name!')
		return
	}
	if (!validateFileName(folderName)) {
		return
	}
	if (currentFolderName == '') {
		currentFolderName = folderName
		$('#folderName').prop('readonly', true)
	} // Set folder name for current mod

	if (!currentLua.created || currentLua.content == '') {
		createLua(modName)
	} // Create main.lua if there isnt one

    const itemId = $('#itemId').val()

	const item = new Item(itemId, currentType)

	const itemImg = $('#itemImg')[0]
	const img = itemImg.files[0]
	if (img != undefined) {
		const gfx = gfxs[currentType]

        item.addSprite(img, gfx[itemId])
	}

	let itemName = $('#itemName').val()
	let itemDesc = $('#itemDesc').val()

	// 'sanitize' The item name and description
	// The regex removes " and \
	itemName = itemName.replace(/['"]+/g, '').replace(/\\/g, '')
	itemDesc = itemDesc.replace(/['"]+/g, '').replace(/\\/g, '')

    item.addAttributes(itemName, itemDesc)

	if (img == undefined && itemName == '' && itemDesc == '') {
		alert('Item has no image, name and description!')
		return
	}

	$('#itemId').val('')
	$('#itemName').val('')
	$('#itemDesc').val('')

	$(`#itemId option[value=${itemId}]`).remove()
	removedOptions[currentType].push(itemId)

	clearFileInput(itemImg)

	const idx = files.push(item) - 1
	addToItemTable(idx)
}

async function downloadFinishedZip() {
	compileSprites(currentFolderName)
	appendItemsToLua()
	zip.folder(currentFolderName).file('main.lua', currentLua.content)

	// Why is .folder(currentFolderName) everywhere instead of
	// creating a folder obj from `zip` and using that instead of `zip`?
	// Simple - it doesn't work, and I dont know why

	zip.generateAsync({type: 'blob'}).then((content) => {
		// Make and click a temporary link to download the Blob
		const link = document.createElement('a')
		link.href = URL.createObjectURL(content)
		link.download = 'mod.zip'
		link.click()
		link.remove()
	})

	// == Clear all data
	resetCoreVars()

	$('#folderName').val('') // Clear the folder name
	currentFolderName = ''

	$('#modName').val('') // Clear mod name

	$('#itemId option').remove() // Clear the dropdown

	fillItemSelector(currentType)

	// Clear the readonly attributes
	$('#modName').removeAttr('readonly')
	$('#folderName').removeAttr('readonly')

	// Clear table
	$('#itemTable td').remove()

	// Remove the exit confirmation
	window.onbeforeunload = null
}