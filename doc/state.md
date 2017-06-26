## State tree of Protoplan editor

### First level

```json
    {
        "layers": {},   // 4 layes on map
        "map": {},      // map state 
        "editor": {},   // editor state
        "views": {},    // UI state for each views
        "session": {}   // 
    }
```

### Second level - "layers" leaf

```json
    {
        "layers": {
            "base" : {
                "url": "string",
                "svg": "???",
                "size_px": {x: 123, y: 123},
                "size_m": {x: 123, y: 123}
            },
            "additional": {
                "features": {
                    "uid#1": {
                        "id": "uid#1",
                        "geometry": "GeoJson",
                        "style_id": "style_uid#1"
                    },
                    "uid#2": {
                        "id": "uid#2",
                        "geometry": "GeoJson",
                        "style_id": "style_uid#2"
                    },
                },
                "styles": {
                    "style_uid#1": {
                        "id": "style_uid#1",
                        "name": "",
                        "style": {} 
                    }
                }
            },
            "stands": {
                "features" : {
                    "stand_uid#1": {
                        "id": "stand_uid#1",
                        "geometry": "GeoJson",
                        "type": "one of 4th types",
                        "categories": "one of Nth cats",
                        "label": {
                            "geometry": "Point",
                            "rotation": "0",
                        },
                        "equipment": {
                            "equipment#1": {
                                "geometry": "Point",
                                "rotation": "0"
                            }
                        }
                    }
                },
                "type": {
                    "1": {...},
                    "2": {...},
                    "3": {...},
                    "4": {...},
                },
                "categories": {
                    "uid#1": {...},
                    "uid#2": {...},
                }
            },
            "equipment": {
                "equipment#1": {
                    "id": "equipment#1",
                    "url": "string",
                    "svg": "???",
                    "size_px": {x: 123, y: 123},
                    "size_m": {x: 123, y: 123}                    
                },
                "equipment#2": {...}
            }
            
        }
    }
```