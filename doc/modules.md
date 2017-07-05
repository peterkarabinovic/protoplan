## config.json
styles for overlay:

1. walls N
2. carpet N
3. note N

## Base

### base-view
in/out: selectedBase
form for edit width/heigth, distance length and choose file

### base-map-view
in: selectedBase
рисует image/canavas layer


### base-map-distance
in/out: selectedBase


## Overlay

### overlay-view
in: selectedOVerlay, config.json, overlay-ui: {selectedWallStyle, selectedCarpetStyle, selectedNoteSyle}
out: map.drawMap
включает режимы рисования - wall, caret, note
выбирает-устанавливает styles for wall, carpet, note

### overlay-map-view
in: selectedOverlay, config.json
out: selectedOverlayFeat
рисует и выбирает feature 

### overlay-tools
in: selectedOverlay, selectedOverlayFeat
выводит toolbar для выбранного объекта

### overlay-edit
in: selectedOverlay, map.drawMap
out: selectedOverlayFeat
создает новый Feature и устанавливает как selected

## Equipments

### equipments-view
in: equipments, config.json
form for add/remove equipment image and input for width/heigth

## Stands

### stands-view
in: selectedStandLayer, selectedStand, config.json, selectedStendCategory, selectedEquipment
out: map.drawMap
включает режимы рисования stand, equipment

### stand-map-view
in: selectedStandLayer, selectedStand, selectedEquipment
out: selectedStand, selectedEquipment
рисует selectedStandLayer и выбирает selectedStand, selectedEquipment

## stand-tools
in: selectedStandLayer, selectedStand
выводит toolbar для выбранного stand 

## stand-equipment-tools
in: selectedStandLayer, selectedStand, selectedEquipment
выводит toolbar для выбранного equipment 


