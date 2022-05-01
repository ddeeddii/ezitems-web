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

import item_gfxs from './data/item_gfxs.json' assert {type: 'json'}
import item_names from './data/item_idtoname.json' assert {type: 'json'}
import trinket_gfxs from './data/trinket_gfxs.json' assert {type: 'json'}
import trinket_names from './data/trinket_idtoname.json' assert {type: 'json'}

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

function appendItemsToLua() {
	for (const itemObj of files) {
		if (itemObj == 'ignoreme') {
			continue
		}

		const type = itemObj['type']
		const id = itemObj['id']

		// After renaming in the table, they arent sanitizied
		// So they are sanitized here again
		const name = itemObj['name'].replace(/['"]+/g, '').replace(/\\/g, '')
		const desc = itemObj['desc'].replace(/['"]+/g, '').replace(/\\/g, '')

		if (name == '' && desc == '') {
			continue
		}

		let i = 0
		let trinketLine
		let itemLine

		let lines = currentLua.split('\n')
		for (const line of lines) {
			i += 1
			if (line.includes('--$$$ITEMS-START$$$')) {
				itemLine = i
			} else if (line.includes('--$$$TRINKETS-START$$$')) {
				trinketLine = i
			}

			if (trinketLine != undefined && itemLine != undefined) {
				break
			}
		}

		const text = `  {${id}, "${name}", "${desc}"},`

		if (type == ItemType.Item) {
			lines.splice(itemLine, 0, text)
		} else if (type == ItemType.Trinket) {
			lines.splice(trinketLine, 0, text)
		}

		currentLua = lines.join('\n')
	}
}

function compileSprites() {
	let folders = {
		root: {
			obj: '',
		},

		item: {
			obj: '',
		},

		trinket: {
			obj: '',
		},
	}

	for (const itemObj of files) {
		if (
			itemObj == 'ignoreme' ||
			itemObj['sprite'] == 'ignoreme' ||
			itemObj['sprite'] == undefined
		) {
			continue
		}

		const sprite = itemObj['sprite']
		const type = itemObj['type']

		// Create root gfx folder if not created already
		if (folders.root.obj == '') {
			folders.root.obj = zip
				.folder('resources')
				.folder('gfx')
				.folder('items')
		}

		// Handle adding the sprites
		if (type == ItemType.Item) {
			if (folders.item.obj == '') {
				folders.item.obj = folders.root.obj.folder('collectibles')
			}

			folders.item.obj.file(sprite.name, sprite.img)
		} else if (type == ItemType.Trinket) {
			if (folders.trinket.obj == '') {
				folders.trinket.obj = folders.root.obj.folder('trinkets')
			}

			folders.trinket.obj.file(sprite.name, sprite.img)
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
	for (const itemObj of files) {
		if (itemObj == 'ignoreme') {
			continue
		}
		length += 1
	}

	return length
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

	let itemObj = []

	const item = $('#itemId').val()
	itemObj['type'] = currentType
	itemObj['id'] = item

	const itemImg = $('#itemImg')[0]
	const img = itemImg.files[0]
	if (img != undefined) {
		let gfx = gfxs[currentType]

		const file = {
			name: gfx[item],
			img: img,
		}

		itemObj['sprite'] = file
	}

	let itemName = $('#itemName').val()
	let itemDesc = $('#itemDesc').val()

	// 'sanitize' The item name and description
	// The regex removes " and \
	itemName = itemName.replace(/['"]+/g, '').replace(/\\/g, '')
	itemDesc = itemDesc.replace(/['"]+/g, '').replace(/\\/g, '')

	itemObj['name'] = itemName
	itemObj['desc'] = itemDesc

	if (img == undefined && itemName == '' && itemDesc == '') {
		alert('Item has no image, name and description!')
		return
	}

	$('#itemId').val('')
	$('#itemName').val('')
	$('#itemDesc').val('')

	$(`#itemId option[value=${item}]`).remove()
	removedOptions[currentType].push(item)

	clearFileInput(itemImg)

	let idx = files.push(itemObj) - 1
	addToItemTable(idx)
}

function addToItemTable(idx) {
	const table = $('#itemTable')[0]
	const itemObj = files[idx]

	const type = itemObj['type']
	const id = itemObj['id']
	const name = itemObj['name']
	const desc = itemObj['desc']

	let typeStr
	if (type == ItemType.Item) {
		typeStr = 'Item'
	} else if (type == ItemType.Trinket) {
		typeStr = 'Trinket'
	}

	let row = table.insertRow(-1)

	let actionsCell = row.insertCell()
	let spriteCell = row.insertCell(0)
	let descCell = row.insertCell(0)
	let nameCell = row.insertCell(0)
	let oldNameCell = row.insertCell(0)
	let typeCell = row.insertCell(0)

	// ========= Actions Cell
	let span = document.createElement('span')
	span.classList.add('icon', 'is-small')

	let icon = document.createElement('i')
	icon.classList.add('fab', 'fa-solid', 'fa-trash')
	icon.setAttribute('aria-hidden', 'true')

	let btn = document.createElement('button')
	btn.classList.add('button', 'is-small', 'delete-button')

	span.appendChild(icon)
	btn.appendChild(span)

	actionsCell.appendChild(btn)

	// ========= Sprite Cell
	spriteCell.setAttribute('align', 'center')

	// Image
	let img = new Image()
	img.width = '32'
	img.height = '32'
	img.style.verticalAlign = 'inherit'

	if (itemObj['sprite'] != undefined) {
		img.src = URL.createObjectURL(itemObj['sprite']['img'])
	}

	spriteCell.appendChild(img)

	// Empty Image
	let emptyImg = new Image()
	emptyImg.width = '32'
	emptyImg.height = '32'
	emptyImg.style.verticalAlign = 'inherit'

	emptyImg.style.display = 'none'

	spriteCell.appendChild(emptyImg)

	// Sprite Delete Button
	let spriteSpan = document.createElement('span')
	spriteSpan.classList.add('icon', 'is-small')

	let spriteIcon = document.createElement('i')
	spriteIcon.classList.add('fab', 'fa-solid', 'fa-trash')
	spriteIcon.setAttribute('aria-hidden', 'true')

	let spriteDeleteBtn = document.createElement('button')
	spriteDeleteBtn.classList.add('button', 'is-small')

	spriteDeleteBtn.style.marginLeft = '5px'

	if (itemObj['sprite'] == undefined) {
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
		files[idx] = 'ignoreme'
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
		let newSpriteInput = document.createElement('input')
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

			let gfx = gfxs[currentType]

			const file = {
				name: gfx[item],
				img: imgNew,
			}

			itemObj['sprite'] = file

			img.src = URL.createObjectURL(itemObj['sprite']['input'])
		}
	}

	img.addEventListener('click', changeSprite)
	emptyImg.addEventListener('click', changeSprite)

	// Sprite Button
	spriteDeleteBtn.addEventListener('click', (evt) => {
		img.style.display = 'none'
		emptyImg.style.display = ''
		spriteDeleteBtn.style.display = 'none'

		itemObj['sprite'] = 'ignoreme'
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
	zip.file('main.lua', currentLua)

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
let state = 1

// Handle starting with low width
$(document).ready(function () {
	const width = $(window).width()
	if (width < 1200) {
		state = 2
		setSelectStyles()
	}
})

// Handle changing to low width (responsiveness)
$(window).resize(function () {
	const width = $(window).width()
	if (width < 1200 && state == 1) {
		state = 2
		setSelectStyles()
	} else if (width > 1200 && state == 2) {
		state = 1
		resetSelectStyles()
	}
})

function setSelectStyles() {
	$('#imageUpload').css({display: 'inline'})

	$('#typeItemSelectors').css({
		display: 'inline',
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
	$('#imageUpload').css({display: ''})

	$('#typeItemSelectors').css({
		display: 'flex',
		'justify-content': 'flex-end',
		'min-width': '',
		'margin-top': '',
	})

	$('#imageUploadSpan').css({
		'margin-top': '',
		'margin-bottom': '',
	})
}
