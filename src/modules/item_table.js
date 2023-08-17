import { currentType } from "../main.js"
import { files, ItemType, names, removedOptions, gfxs } from "./core.js"
import { fillItemSelector } from "./functions.js"

// Helper functions specific to this file
function realFilesLength() {
	let length = 0
	for (const item of files) {
		if (item.ignore) { continue }
		length += 1
	}

	return length
}

export function addToItemTable(idx) {
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

	const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	iconSvg.setAttribute('width', '24')
	iconSvg.setAttribute('height', '24')
	iconSvg.setAttribute('viewBox', '0 0 24 24')

	const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
	iconPath.setAttribute('fill', 'currentColor')
	iconPath.setAttribute('d', 'M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z')

	const btn = document.createElement('button')
	btn.classList.add('button', 'is-small', 'delete-button')

	iconSvg.appendChild(iconPath)
	btn.appendChild(iconSvg)

	actionsCell.appendChild(btn)

	// ========= Sprite Cell
	spriteCell.setAttribute('align', 'center')

	// Image
	const img = new Image(32, 32)
	img.style.verticalAlign = 'inherit'

	if (item.hasSprite()) {
		img.src = URL.createObjectURL(item.sprite.img)
	}

	spriteCell.appendChild(img)

	// Empty Image
	const emptyImg = new Image(32, 32)
	emptyImg.style.verticalAlign = 'inherit'

	emptyImg.style.display = 'none'

	spriteCell.appendChild(emptyImg)

	// Sprite Delete Button
	const spriteIconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	spriteIconSvg.setAttribute('width', '24')
	spriteIconSvg.setAttribute('height', '24')
	spriteIconSvg.setAttribute('viewBox', '0 0 24 24')

	const spriteIconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
	spriteIconPath.setAttribute('fill', 'currentColor')
	spriteIconPath.setAttribute('d', 'M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z')

	spriteIconSvg.appendChild(spriteIconPath)

	// spriteIcon.classList.add('fab', 'fa-solid', 'fa-trash')

	const spriteDeleteBtn = document.createElement('button')
	spriteDeleteBtn.classList.add('button', 'is-small')

	spriteDeleteBtn.style.marginLeft = '5px'

	if (!item.hasSprite()) {
		spriteDeleteBtn.style.display = 'none'
	}

	spriteDeleteBtn.appendChild(spriteIconSvg)

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