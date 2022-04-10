const template = `
-- Generated with ez-name
local mod = RegisterMod(%NAME%, 1)

-- {itemId, 'name', 'desc'}
local items = {
  --$$$ITEMS-START$$$

}

local trinkets = {
  --$$$TRINKETS-STRART$$$

}

local game = Game()
if EID then
  -- Adds trinketd defined in trinkets
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
  -- Adds trinketd defined in trinkets
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

local t_queueLastFrame
local t_queueNow
mod:AddCallback(ModCallbacks.MC_POST_PLAYER_UPDATE, function (_, player)
  if #trinkets == 0 then return end
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

-- Handle displaying item names
local i_queueLastFrame
local i_queueNow
mod:AddCallback(ModCallbacks.MC_POST_PLAYER_UPDATE, function (_, player)
  if #items == 0 then return end
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
`

import { downloadZip } from 'https://cdn.jsdelivr.net/npm/client-zip/index.js'

import item_gfxs from '/data/item_gfxs.json' assert {type: 'json'};
import item_names from '/data/item_idtoname.json' assert {type: 'json'}
import trinket_gfxs from '/data/trinket_gfxs.json' assert {type: 'json'}
import trinket_names from '/data/trinket_idtoname.json' assert {type: 'json'}

const ItemType = {
  Item: 1,
  Trinket: 2
}

let files = []
let mainLuaExist = false
let currentLua = ''
let currentType = ItemType.Item

let currentFolderName = ''
let currentFolderPath = `resources/gfx/items/collectibles`

let removedOptions = {
  1: [],
  2: []
}

// helper funcs start
function clearFileInput(input){
  input.value = ''
}

function fillItemSelector(type){
  let nameType
  if(type == ItemType.Item){ nameType = item_names; type = 1 }
  else if(type == ItemType.Trinket){ nameType = trinket_names; type = 2}

  for (const [id, name] of Object.entries(nameType)) {
    if(removedOptions[type].includes(id)){continue;} // check if the item was added before

    $('#itemId').append($('<option>', {
      value: id,
      text: `${name} | ${id} `
    }));
  }
}

function createLua(name){
  currentLua = template.replace('%NAME%', `"${name}"`)
  mainLuaExist = true
}

function addItem(type, id, name, desc){
  // possibly make this only once, then offset off it
  let i = 0
  let trinketLine
  let itemLine

  let lines = currentLua.split('\n')
  for (const line of lines){
    i += 1
    if(line.includes('--$$$ITEMS-START$$$')){
      itemLine = i
    } else if(line.includes('--$$$TRINKETS-STRART$$$')){
      trinketLine = i
    }
    
    if(trinketLine != undefined && itemLine != undefined){ break }
  }

  const text = `  {${id}, "${name}", "${desc}"},`

  if(type == ItemType.Item){
    lines.splice(itemLine, 0, text)
  } else if(type == ItemType.Trinket){
    lines.splice(trinketLine, 0, text)
  }

  currentLua = lines.join('\n')
}

function clearAllInputs(){
  $('#itemId').val('')
  $('#itemName').val('')
  $('#itemDesc').val('')
  clearFileInput(itemImg)
}

function validateFileName(filename) {
  const re = /^[^\s^\x00-\x1f\\?*:"";<>|\/.][^\x00-\x1f\\?*:"";<>|\/]*[^\s^\x00-\x1f\\?*:"";<>|\/.]+$/;

  if (!re.test(filename)) {
      alert("Error: Invalid folder name!")
      return false
  }

  // validation was successful
  return true
}
// helper funcs end

$(document).ready(function () {
  //console.log(item_gfxs);
  //console.log(item_names);
  //console.log(trinket_gfxs);
  //console.log(trinket_names);
  
  // submit btn callback
  $('#submitBtn').click(function(){
    downloadFinishedZip()
  })

  // add file callback
  $('#newItemBtn').click(function(){
    addFile()
  })

  // add to item name selector
  fillItemSelector(ItemType.Item)

  $("#itemType").change(function() {
    $("#itemId option").remove(); // clears the dropdown
    clearAllInputs()

    const option = $('option:selected', this).val()
    if(option == 2){
      fillItemSelector(ItemType.Trinket)
      currentType = ItemType.Trinket
      currentFolderPath = 'resources/gfx/items/trinkets'

    } else if(option == 1){
      fillItemSelector(ItemType.Item)
      currentType = ItemType.Item
      currentFolderPath = 'resources/gfx/items/collectibles'
    }

  });

});

function addFile(){
  const modName = $('#modName').val()
  if(modName == ''){alert('No mod name!'); return}

  const folderName = $('#folderName').val()
  if(folderName == ''){alert('No folder name!'); return}
  if(!validateFileName(folderName)){return}
  if(currentFolderName == ''){ currentFolderName = folderName} // set folder name for current mod

  if(!mainLuaExist){createLua(modName)} // create main.lua if there isnt one

  const item = $('#itemId').val()
  const itemImg = $('#itemImg')[0]
  const img = itemImg.files[0]
  if(img != undefined){
    let gfx
    if(currentType == ItemType.Item){ gfx = item_gfxs}
    else if(currentType == ItemType.Trinket){ gfx = trinket_gfxs}

    const file = {name: `${currentFolderName}/${currentFolderPath}/${gfx[item]}`,
                  lastModified: new Date(), input: img}

    files.push(file)
  }

  const itemName = $('#itemName').val()
  const itemDesc = $('#itemDesc').val()

  if(item != undefined && itemDesc != undefined){
    addItem(currentType, item, itemName, itemDesc)
  }

  $('#itemId').val('')
  $('#itemName').val('')
  $('#itemDesc').val('')

  $(`#itemId option[value=${item}]`).remove();
  removedOptions[currentType].push(item)

  clearFileInput(itemImg)
}

async function downloadFinishedZip() {

  const lua = {name: `${currentFolderName}/main.lua`, lastModified: new Date(), input: currentLua}
  files.push(lua)

  const blob = await downloadZip(files).blob()

  // make and click a temporary link to download the Blob
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'mod.zip'
  link.click()
  link.remove()
  
  // clear all data
  files = []
  currentLua = template
  mainLuaExist = false
  removedOptions = {
    1: [],
    2: []
  }

  $('#folderName').val('') // clears the folder name
  currentFolderName = ''

  $('#modName').val('') // clears mod name

  $("#itemId option").remove(); // clears the dropdown
  fillItemSelector(currentType)
}