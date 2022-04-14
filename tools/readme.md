# Tools

## parsegfxs.py
This tool parses a folder that contains item/trinket graphics files and returns a json file that links item id's to their corresponding sprite names (see `data/trinket_gfxs.json` or `item_gfxs.json`).

### Usage
1. Combine the AB+ & Repentance item/trinket sprites folders into one
2. Change the offset (trinket/item) in the script
3. Select the combined folder
4. Run

## Parsing items to bind *item id - item name*
`data/item_idtoname.json` was created by parsing Da Rule's `darulesscripts/drdictionaries.lua`, specifically `DRItemDescsEN` and `DRTrinketDescsEN`, into an usable JSON file.
