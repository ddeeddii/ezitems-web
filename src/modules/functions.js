import { names, removedOptions } from "./core.js"

export function fillItemSelector(type) {
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

export function getItemTrinketLines(lua) {
	let itemLine
	let trinketLine

	const lines = lua.split('\n')

	itemLine = lines.indexOf('  --$$$ITEMS-START$$$') + 1
	trinketLine = lines.indexOf('  --$$$TRINKETS-START$$$') + 1

	return [itemLine, trinketLine]
}