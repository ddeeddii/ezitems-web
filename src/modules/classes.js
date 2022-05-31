// Proper Item implementation
export class Item {
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
        return this.sprite.img != undefined
    }

	removeSprite(){
		this.sprite.img = undefined
		this.sprite.name = undefined
		return this
	}

}
