const template = `-- Generated with ddeeddii.github.io/ezitems-web/
local mod = RegisterMod(%NAME%, 1)

-- {itemId, 'name', 'desc'}
local items = {
  --$$$ITEMS-START$$$

}

local trinkets = {
  --$$$TRINKETS-START$$$

}

local game = Game()
if EID then
  -- Adds trinkets defined in trinkets
	for _, trinket in ipairs(trinkets) do
		local EIDdescription = EID:getDescriptionObj(5, 350, trinket[1]).Description
		EID:addTrinket(trinket[1], EIDdescription, trinket[2], "en_us")
	end

  -- Adds items defined in items
  for _, item in ipairs(items) do
		local EIDdescription = EID:getDescriptionObj(5, 100, item[1]).Description
		EID:addCollectible(item[1], EIDdescription, item[2], "en_us")
	end
end

if Encyclopedia then
  -- Adds trinkets defined in trinkets
	for _,trinket in ipairs(trinkets) do
		Encyclopedia.UpdateTrinket(trinket[1], {
			Name = trinket[2],
			Description = trinket[3],
		})
	end

  -- Adds items defined in items
  for _, item in ipairs(items) do
		Encyclopedia.UpdateItem(item[1], {
			Name = item[2],
			Description = item[3],
		})
	end
end

-- Handle displaying trinket names

if #trinkets ~= 0 then
    local t_queueLastFrame
    local t_queueNow
    mod:AddCallback(ModCallbacks.MC_POST_PLAYER_UPDATE, function (_, player)
        t_queueNow = player.QueuedItem.Item
        if (t_queueNow ~= nil) then
            for _, trinket in ipairs(trinkets) do
                if (t_queueNow.ID == trinket[1] and t_queueNow:IsTrinket() and t_queueLastFrame == nil) then
                    game:GetHUD():ShowItemText(trinket[2], trinket[3])
                end
            end
        end
        t_queueLastFrame = t_queueNow
    end)
end

-- Handle displaying item names

if #items ~= 0 then
    local i_queueLastFrame
    local i_queueNow
    mod:AddCallback(ModCallbacks.MC_POST_PLAYER_UPDATE, function (_, player)
        i_queueNow = player.QueuedItem.Item
        if (i_queueNow ~= nil) then
            for _, item in ipairs(items) do
                if (i_queueNow.ID == item[1] and i_queueNow:IsCollectible() and i_queueLastFrame == nil) then
                    game:GetHUD():ShowItemText(item[2], item[3])
                end
            end
        end
        i_queueLastFrame = i_queueNow
    end)
end
`
let zip = new JSZip()

import item_gfxs from '../data/item_gfxs.json' assert {type: 'json'}
import item_names from '../data/item_idtoname.json' assert {type: 'json'}
import trinket_gfxs from '../data/trinket_gfxs.json' assert {type: 'json'}
import trinket_names from '../data/trinket_idtoname.json' assert {type: 'json'}

const ItemType = {
	Item: 1,
	Trinket: 2,
}

let files = []

let currentLua = ''
let currentLuaCreated = false
let currentType = ItemType.Item
let currentFolderName = ''

const names = {
	1: item_names,
	2: trinket_names,
}

const gfxs = {
	1: item_gfxs,
	2: trinket_gfxs,
}

let removedOptions = {
	1: [],
	2: [],
}


// Proper Item implementation
class Item {
    /**
    * Create an Item
    * @param {number} id - ID
    * @param {number} type - Type
    */
	constructor(id, type) {
		this.id = id
		this.type = type

		this.desc = ''
		this.name = ''
		this.sprite = {
			img: undefined,
			name: undefined,
		}

        this.ignore = false
	}

    /**
    * Add item & description
    * @param {string} name - Name
    * @param {string} desc - Description
    */
    addAttributes(name, desc){
        this.name = name
        this.desc = desc
        return this
    }

    /**
    * Add a sprite
    * @param {File} img - Sprite Image
    * @param {string} name - Image Name
    */
    addSprite(img, name){
        this.sprite.img = img
        this.sprite.name = name
        return this
    }

    hasSprite(){
        console.log('HasSprite():', this.sprite.img != undefined);
        return this.sprite.img != undefined
    }

	removeSprite(){
		this.sprite.img = undefined
		this.sprite.name = undefined
		return this
	}

}

// ================================== Helper functions start

function clearFileInput(input) {
	input.value = ''

	const fileName = document.querySelector('#imageUpload .file-name')
	fileName.textContent = 'No sprite selected'
}

function fillItemSelector(type) {
	for (const [id, name] of Object.entries(names[type])) {
		if (removedOptions[type].includes(id)) {
			continue
		} // Check if the item was added before

		$('#itemId').append(
			$('<option>', {
				value: id,
				text: `${name} | ${id} `,
			})
		)
	}
}

function createLua(name) {
	// Sanitize the name
	name = name.replace(/['"]+/g, '').replace(/\\/g, '')

	currentLua = template.replace('%NAME%', `"${name}"`)
	$('#modName').prop('readonly', true)
	currentLuaCreated = true
}

function getItemTrinketLines(lua) {
	let itemLine
	let trinketLine

	const lines = lua.split('\n')

	itemLine = lines.indexOf('  --$$$ITEMS-START$$$') + 1
	trinketLine = lines.indexOf('  --$$$TRINKETS-START$$$') + 1

	return [itemLine, trinketLine]
}

function appendItemsToLua() {
	for (const item of files) {
		if (item.ignore) {
			continue
		}

		const type = item.type
		const id = item.id

		// After renaming in the table, they arent sanitizied
		// So they are sanitized here again
        console.log(item);
		const name = item.name.replace(/['"]+/g, '').replace(/\\/g, '')
		const desc = item.desc.replace(/['"]+/g, '').replace(/\\/g, '')

		if (name == '' && desc == '') {
			continue
		}

		const [itemLine, trinketLine] = getItemTrinketLines(currentLua)

		const text = `  {${id}, "${name}", "${desc}"},`

		const lines = currentLua.split('\n')

		if (type == ItemType.Item) {
			lines.splice(itemLine, 0, text)
		} else if (type == ItemType.Trinket) {
			lines.splice(trinketLine, 0, text)
		}

		currentLua = lines.join('\n')
	}
}

function compileSprites() {
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
				.folder(currentFolderName)
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

function clearAllInputs() {
	$('#itemId').val('')
	$('#itemName').val('')
	$('#itemDesc').val('')
	clearFileInput(itemImg)
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

function realFilesLength() {
	let length = 0
	for (const item of files) {
		if (item.ignore) { continue }
		length += 1
	}

	return length
}

function getKeyByValue(object, value) {
	return Object.keys(object).find((key) => object[key] == value)
}

// ================================== Helper functions end

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

	if (!currentLuaCreated || currentLua == '') {
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

function addToItemTable(idx) {
	const table = $('#itemTable')[0]
	const item = files[idx]

	const type = item.type
	const id = item.id
	const name = item.name
	const desc = item.desc

	let typeStr
	if (type == ItemType.Item) {
		typeStr = 'Item'
	} else if (type == ItemType.Trinket) {
		typeStr = 'Trinket'
	}

	const row = table.insertRow(-1)

	const actionsCell = row.insertCell()
	const spriteCell = row.insertCell(0)
	const descCell = row.insertCell(0)
	const nameCell = row.insertCell(0)
	const oldNameCell = row.insertCell(0)
	const typeCell = row.insertCell(0)

	// ========= Actions Cell
	const span = document.createElement('span')
	span.classList.add('icon', 'is-small')

	const icon = document.createElement('i')
	icon.classList.add('fab', 'fa-solid', 'fa-trash')
	icon.setAttribute('aria-hidden', 'true')

	const btn = document.createElement('button')
	btn.classList.add('button', 'is-small', 'delete-button')

	span.appendChild(icon)
	btn.appendChild(span)

	actionsCell.appendChild(btn)

	// ========= Sprite Cell
	spriteCell.setAttribute('align', 'center')

	// Image
	const img = new Image()
	img.width = '32'
	img.height = '32'
	img.style.verticalAlign = 'inherit'

	if (item.hasSprite()) {
		img.src = URL.createObjectURL(item.sprite.img)
	}

	spriteCell.appendChild(img)

	// Empty Image
	const emptyImg = new Image()
	emptyImg.width = '32'
	emptyImg.height = '32'
	emptyImg.style.verticalAlign = 'inherit'

	emptyImg.style.display = 'none'

	spriteCell.appendChild(emptyImg)

	// Sprite Delete Button
	const spriteSpan = document.createElement('span')
	spriteSpan.classList.add('icon', 'is-small')

	const spriteIcon = document.createElement('i')
	spriteIcon.classList.add('fab', 'fa-solid', 'fa-trash')
	spriteIcon.setAttribute('aria-hidden', 'true')

	const spriteDeleteBtn = document.createElement('button')
	spriteDeleteBtn.classList.add('button', 'is-small')

	spriteDeleteBtn.style.marginLeft = '5px'

	if (!item.hasSprite()) {
		spriteDeleteBtn.style.display = 'none'
	}

	spriteSpan.appendChild(spriteIcon)
	spriteDeleteBtn.appendChild(spriteSpan)

	spriteCell.appendChild(spriteDeleteBtn)

	// ========= Description Cell
	descCell.innerHTML = desc
	descCell.setAttribute('contenteditable', 'true')
	descCell.addEventListener('input', (evt) => {
		files[idx]['desc'] = descCell.innerHTML
	})

	// ========= Name Cell
	nameCell.innerHTML = name
	nameCell.setAttribute('contenteditable', 'true')
	nameCell.addEventListener('input', (evt) => {
		files[idx]['name'] = nameCell.innerHTML
	})

	// ========= Vanilla Name Cell
	oldNameCell.innerHTML = names[type][id]

	// ========= Type Cell
	typeCell.innerHTML = typeStr

	// ========= Event Listeners
	// Remove button
	btn.addEventListener('click', (evt) => {
		files[idx].ignore = true
		row.remove()

		// WARNING
		// There is a possiblility that removedIdx is -1
		// In that case bad thing will happen

		// Make the item available again
		const removedIdx = removedOptions[type].indexOf(id, 0)
		removedOptions[type][removedIdx] = ''

		// Reset dropdown to account for item being available again
		$('#itemId option').remove()
		fillItemSelector(currentType)

		if (realFilesLength() == 0) {
			window.onbeforeunload = null
		}
	})

	// Sprite Image
	function changeSprite() {
		const newSpriteInput = document.createElement('input')
		newSpriteInput.type = 'file'
		newSpriteInput.accept = 'image/x-png'
		newSpriteInput.click()

		newSpriteInput.onchange = () => {
			// Change the empty image for the actual image
			if ((spriteDeleteBtn.style.display = 'none')) {
				img.style.display = ''
				emptyImg.style.display = 'none'
				spriteDeleteBtn.style.display = ''
			}

			const imgNew = newSpriteInput.files[0]

			const gfx = gfxs[item.type]

			item.addSprite(imgNew, gfx[id])

			img.src = URL.createObjectURL(item.sprite.img)
		}
	}

	img.addEventListener('click', changeSprite)
	emptyImg.addEventListener('click', changeSprite)

	// Sprite Button
	spriteDeleteBtn.addEventListener('click', (evt) => {
		img.style.display = 'none'
		emptyImg.style.display = ''
		spriteDeleteBtn.style.display = 'none'

		item.removeSprite()
	})

	// Exit confirmation
	if (typeof window.onbeforeunload != 'function') {
		window.onbeforeunload = function () {
			return true
		}
	}
}

async function downloadFinishedZip() {
	compileSprites()
	appendItemsToLua()
	zip.folder(currentFolderName).file('main.lua', currentLua)

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

	// Clear all data
	zip = new JSZip()
	files = []
	currentLua = template
	currentLuaCreated = false
	removedOptions = {
		1: [],
		2: [],
	}

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

// Handle changing to inline when using incompatible widths
let responsiveState = 1

// Handle starting with low width
$(document).ready(function () {
	const width = $(window).width()
	if (width < 1200) {
		responsiveState = 2
		setSelectStyles()
	}
})

// Handle changing to low width (responsiveness)
$(window).resize(function () {
	const width = $(window).width()
	if (width < 1200 && responsiveState == 1) {
		responsiveState = 2
		setSelectStyles()
	} else if (width > 1200 && responsiveState == 2) {
		responsiveState = 1
		resetSelectStyles()
	}
})

function setSelectStyles() {
	$('#imageUpload').css({'display': 'inline'})

	$('#typeItemSelectors').css({
		'display': 'inline',
		'justify-content': '',
		'min-width': 'fit-content',
		'margin-top': '5px',
	})

	// @ts-ignore
	$('#imageUploadSpan').css({
		'margin-top': '5px',
		'margin-bottom': '5px',
	})
}

function resetSelectStyles() {
	$('#imageUpload').css({'display': ''})

	$('#typeItemSelectors').css({
		'display': 'flex',
		'justify-content': 'flex-end',
		'min-width': '',
		'margin-top': '',
	})

	$('#imageUploadSpan').css({
		'margin-top': '',
		'margin-bottom': '',
	})
}

// Handle sidebar stuff

let sidebarOpen = false

function closeSidebar() {
	$('#sidebar').css({
		'width': '',
	})
	sidebarOpen = false
}

function openSidebar() {
	$('#sidebar').css({
		'width': '15%',
	})
	sidebarOpen = true
}

$(document).ready(function () {
	// Open the menu
	$('#menuBtn').click(function () {
		if (sidebarOpen) {
			closeSidebar()
		} else {
			openSidebar()
		}
	})

	$('#sidebar').click(function () {
		closeSidebar()
	})
})

// ======================= Edit existing mods

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

			const item = new Item()

			item.id = obj.id
			item.type = type

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
