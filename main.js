const template = `-- Generated with ezitems-web
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
		local EIDdescription = EID:getDescriptionObj(5, 350, item[1]).Description
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

import {downloadZip} from 'https://cdn.jsdelivr.net/npm/client-zip/index.js'

import item_gfxs from '/data/item_gfxs.json' assert {type: 'json'}
import item_names from '/data/item_idtoname.json' assert {type: 'json'}
import trinket_gfxs from '/data/trinket_gfxs.json' assert {type: 'json'}
import trinket_names from '/data/trinket_idtoname.json' assert {type: 'json'}

const ItemType = {
	Item: 1,
	Trinket: 2,
}

let files = []

let currentLua = ''
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

const path = {
	1: 'resources/gfx/items/collectibles',
	2: 'resources/gfx/items/trinkets',
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
	let nameType
	if (type == ItemType.Item) {
		nameType = item_names
		type = 1
	} else if (type == ItemType.Trinket) {
		nameType = trinket_names
		type = 2
	}

	for (const [id, name] of Object.entries(nameType)) {
		if (removedOptions[type].includes(id)) {
			continue
		} // check if the item was added before

		$('#itemId').append(
			$('<option>', {
				value: id,
				text: `${name} | ${id} `,
			})
		)
	}
}

function createLua(name) {
	currentLua = template.replace('%NAME%', `"${name}"`)
	$('#modName').prop('readonly', true)
}

function appendItemsToLua() {
	for (const itemObj of files) {
		if (itemObj == 'ignoreme') {
			continue
		}

		const type = itemObj['type']
		const id = itemObj['id']
		const name = itemObj['name']
		const desc = itemObj['desc']

		if (name == '' || desc == '') {
			alert('item has no item / desc, skipping when compiling lua')
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
	let sprites = []

	for (const itemObj of files) {
		if (itemObj == 'ignoreme') {
			continue
		}

		if (itemObj['sprite'] != undefined) {
			sprites.push(itemObj['sprite'])
		}
	}

	return sprites
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
		alert('Error: Invalid folder name!')
		return false
	}

	return true
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
		$('#itemId option').remove() // clears the dropdown
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
	} // set folder name for current mod

	if ((currentLua = '')) {
		createLua(modName)
	} // create main.lua if there isnt one

	let itemObj = []

	const item = $('#itemId').val()
	itemObj['type'] = currentType
	itemObj['id'] = item

	const itemImg = $('#itemImg')[0]
	const img = itemImg.files[0]
	if (img != undefined) {
		let gfx = gfxs[currentType]
		const file = {
			name: `${currentFolderName}/${path[currentType]}/${gfx[item]}`,
			lastModified: new Date(),
			input: img,
		}

		itemObj['sprite'] = file
		//files.push(file)
	}

	const itemName = $('#itemName').val()
	const itemDesc = $('#itemDesc').val()
	itemObj['name'] = itemName
	itemObj['desc'] = itemDesc

	if (img == undefined && itemName == '' && itemDesc == '') {
		alert('Item is empty!')
		return
	}

	$('#itemId').val('')
	$('#itemName').val('')
	$('#itemDesc').val('')

	$(`#itemId option[value=${item}]`).remove()
	removedOptions[currentType].push(item)

	clearFileInput(itemImg)

	console.log('adding to items', itemObj)
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

	let btn = document.createElement('button')
	btn.innerHTML = 'Delete'

	// Style
	btn.classList.add('delete')
	btn.style.margin = 'auto'
	btn.style.display = 'block'

	actionsCell.appendChild(btn)

	if (itemObj['sprite'] != undefined) {
		let img = new Image()
		img.src = URL.createObjectURL(itemObj['sprite']['input'])
		img.width = '32'
		img.height = '32'
		spriteCell.appendChild(img)
	}

	descCell.innerHTML = desc
	nameCell.innerHTML = name
	oldNameCell.innerHTML = names[type][id]
	typeCell.innerHTML = typeStr

	descCell.setAttribute('contenteditable', 'true')
	nameCell.setAttribute('contenteditable', 'true')

	descCell.addEventListener('input', (evt) => {
		files[idx]['desc'] = descCell.innerHTML
	})

	nameCell.addEventListener('input', (evt) => {
		files[idx]['name'] = nameCell.innerHTML
	})

	btn.addEventListener('click', (evt) => {
		files[idx] = 'ignoreme'
		row.remove()
	})

	spriteCell.addEventListener('click', (evt) => {
		let newSpriteInput = document.createElement('input')
		newSpriteInput.type = 'file'
		newSpriteInput.accept = 'image/x-png'
		newSpriteInput.click()

		newSpriteInput.onchange = () => {
			const imgNew = newSpriteInput.files[0]

			const file = {
				name: `${currentFolderName}/${path[type]}/${gfxs[type][id]}`,
				lastModified: new Date(),
				input: imgNew,
			}

			itemObj['sprite'] = file

			let img = new Image()
			img.src = URL.createObjectURL(itemObj['sprite']['input'])
			img.width = '32'
			img.height = '32'
			spriteCell.replaceChildren(img)
		}
	})
}

async function downloadFinishedZip() {
	console.log('files', files)
	let compiledFiles = compileSprites()

	appendItemsToLua()
	const lua = {
		name: `${currentFolderName}/main.lua`,
		lastModified: new Date(),
		input: currentLua,
	}
	compiledFiles.push(lua)

	console.log('final compfiles:', compiledFiles)
	const blob = await downloadZip(compiledFiles).blob()

	// make and click a temporary link to download the Blob
	const link = document.createElement('a')
	link.href = URL.createObjectURL(blob)
	link.download = 'mod.zip'
	link.click()
	link.remove()

	// clear all data
	files = []
	currentLua = template
	removedOptions = {
		1: [],
		2: [],
	}

	$('#folderName').val('') // clears the folder name
	currentFolderName = ''

	$('#modName').val('') // clears mod name

	$('#itemId option').remove() // clears the dropdown
	fillItemSelector(currentType)

	// clear the readonly attributes
	$('#modName').removeAttr('readonly')
	$('#folderName').removeAttr('readonly')

	// clear table
	$('#itemTable td').remove()
}
