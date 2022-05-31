import item_names from '../../data/item_idtoname.json' assert {type: 'json'}
import trinket_names from '../../data/trinket_idtoname.json' assert {type: 'json'}
import item_gfxs from '../../data/item_gfxs.json' assert {type: 'json'}
import trinket_gfxs from '../../data/trinket_gfxs.json' assert {type: 'json'}

export const names = {
	1: item_names,
	2: trinket_names,
}

export const gfxs = {
	1: item_gfxs,
	2: trinket_gfxs,
}

export const ItemType = {
	Item: 1,
	Trinket: 2,
}

export let zip = new JSZip()
export let files = []

export const currentLua = {
    content: '',
    created: false
}

export const removedOptions = {
	1: [],
	2: [],
}

export function resetCoreVars(){
    zip = new JSZip()

    files = []

    currentLua.content = '',
    currentLua.created = false

    removedOptions[1] = []
    removedOptions[2] = []
}