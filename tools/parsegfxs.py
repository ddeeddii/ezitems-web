from xml.dom import minidom
import tkinter as tk
import tkinter.filedialog as fd
import json
import os

itemIds = {}

filetypes = (
    ('XML Files', '*.xml'),
    ('All Files', '*.*')
)

offsets = {
    "item": 13,
    "trinket": 8 
}

def extractData():
    print("Open folder")
    root = tk.Tk()
    root.withdraw()
    path = fd.askdirectory(title="Open combined dirs",)

    itemGfx = {}

    with os.scandir(path) as rootFolder:
        for entry in rootFolder:
            _, name = os.path.split(entry.path)
            idTemp = name[ offsets["trinket"]: ] # Change here
            id = str(int(idTemp[:3]))
            itemGfx[id] = name

    out = open("trinketgfxs.json", "a") # Change name here
    json.dump(itemGfx, out)
    out.close()

    print(json.dumps(itemGfx))
    input("\nSuccess!\n")


extractData()