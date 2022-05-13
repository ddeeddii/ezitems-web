[![The GitHub pages][1]][2]

[1]: https://i.ibb.co/x524Y8S/chrome-a-IMK50kn-NJ.png
[2]: https://ddeeddii.github.io/ezitems-web/

# ezitems-web
Web app to create simple item rename/resprite mods for Repentance.

Upgrade/Alternative to `isaac-ez-name-changer`.

## Installation
### Option 1
Run the [GitHub pages](https://ddeeddii.github.io/ezitems-web/) in your preferred browser

Alternatively, you can run the latest **beta** version [here](https://ezitems-beta.vercel.app/).

### Option 2
Clone the repo and start a local server

## Usage
When pressing the red *download* button, the website generates a zip file that contains the mod folder. Unzip the contents **of the zip file, not the folder** into the Isaac mod folder, which is located where Isaac is installed.

You can change only the sprite of an item, without changing the name and description by not providing them. Vice-versa you can only change the name and description, by not providing a sprite.

You can change the item name, description or sprite by clicking on their corresponding entries in the table located at the bottom. You can also delete an item by pressing the trash button on the right side of the table.

You can also delete an item sprite by pressing the trash button next to the sprite. To add it back, simply press the highlighted box to the left of it.

Once one item has been added, the folder name and mod name are not changeable.

The theme can be changed by changing the theme of your browser or your OS.

When uploading sprites, the sprites **must be** 32x32 and have a 32 bit depth in order to work properly in game.

For any problems with the app, feel free to submit an issue or DM me on discord 

## Credits
**Kittenchilly** - `ezitems-web` combines [Yet Another Voodoo Pin over Dull Razor
](https://steamcommunity.com/sharedfiles/filedetails/?id=2586699693) and [Electric Penny over Charged Penny
](https://steamcommunity.com/sharedfiles/filedetails/?id=2606524433)'s code into one concise template which is used in all generated mods that change names/descriptions.

**JSG** - Da Rules - `ezitems-web` parses some of `drdictionaries.lua`'s tables into JSON and uses them.

**Libraries** - `ezitems-web` uses the following libraries:
- [JQuery](https://jquery.com/)
- [JSZip](https://github.com/Stuk/jszip)
- [Bulma](https://github.com/jgthms/bulma)
- [bulma-prefers-dark](https://github.com/jloh/bulma-prefers-dark)
- [Font Awesome](https://fontawesome.com/)
