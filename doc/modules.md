## config.json
styles for overlay:

1. walls N
2. carpet N
3. note N


## Map

### map
in: map.size_m

рассчитывает transformation и рисует грид

## Base

### base-view
in: selectedBase

out: map.drawMode,
     selectedBase

form for edit width/heigth, distance length and choose file

### base-map-view
in: selectedBase
рисует image/canavas layer


### base-map-distance
in: map.drawMode, selectedBase.size_m
out: selectedBase.distance
рисует линию и обновляет ее tooltip


## Overlay

### overlay-view
in: selectedOVerlay, config.json, ui.overlay: {wallStyle, carpetStyle, noteSyle}

out: map.drawMap

включает режимы рисования - wall, caret, note

выбирает-устанавливает styles for wall, carpet, note


### overlay-map-view
in: selectedOverlay, config.json, ui.overlay.feat
рисует overlay и feat

### overlay-select-tools
in: overlayMapView, ui.overlay.feat
выбирает обьект и выводит toolbar

### overlay-edit
in: selectedOverlay, map.drawMap
создает новый Feature 

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


