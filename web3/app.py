# -*- coding: utf-8 -*-
# from gevent import monkey
# monkey.patch_all()
import codecs
import glob
import json
import os
import random
from contextlib import contextmanager

import flask
from flask import Flask, jsonify, abort
from flask import request
from flask import send_from_directory
from gevent import wsgi


# prepare data json files
def create_data_file(file_name):
    file_json = os.path.join('.', 'assets', 'data', file_name)
    if not os.path.exists(file_json):
        with open(file_json, 'w') as f:
            f.write('{}')
    return file_json

pavilions_json = create_data_file('pavilions.json')
base_json = create_data_file('base.json')
overlay_json = create_data_file('overlay.json')
stands_json = create_data_file('stands.json')


# Model
@contextmanager
def pavilions():
    with codecs.open(pavilions_json, 'r', "utf-8") as file:
        yield json.load(file)        

def pavilion_update(id, pavi):
    with pavilions() as pavis:
        if id == 0 or id == '0':
            pavilion = {}
            id = str(int(max(pavis.keys())) + 1) if pavis else '1'
        else:
            pavilion = pavis.get(id, {})
        pavilion = dict(pavilion, **pavi)
        pavilion['id'] = id
        pavis[id] = pavilion
        with codecs.open(pavilions_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(pavis, ensure_ascii=False))
        return pavilion
    
def pavilion_by_id(id):
    with pavilions() as pavis:
        return pavis.get(id)

def pavilion_delete(id):
    if id is None:
        return
    with pavilions() as pavis:
        pavis = {k: v for k, v in pavis.items() if k != id }
        with codecs.open(pavilions_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(pavis, ensure_ascii=False))


@contextmanager
def base_layers():
    with codecs.open(base_json, 'r', "utf-8") as file:
        yield json.load(file)        

def base_layers_by_id(id):
    with base_layers() as layers:
        return layers.get(id)

def base_layers_delete(id):
    if id is None:
        return
    id = str(id)
    with base_layers() as layers:
        layers = {k: v for k, v in layers.items() if k != id }
        with codecs.open(base_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(layers, ensure_ascii=False))

def base_layers_update(id, new_base):
    with base_layers() as layers:
        base = layers.get(id, {})
        base = dict(base, **new_base)
        layers[id] = base
        with codecs.open(base_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(layers, ensure_ascii=False))
        return base

@contextmanager
def overlay_layers():
    with codecs.open(overlay_json, 'r', "utf-8") as file:
        yield json.load(file)    
            
def overlay_update(id, new_overlay):
    with overlay_layers() as layers:
        overlay = layers.get(id, {})
        overlay = dict(overlay, **new_overlay)
        layers[id] = overlay
        with codecs.open(overlay_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(layers, ensure_ascii=False))
        return overlay

def overlay_delete(id):
    if id is None:
        return
    id = str(id)
    with overlay_layers() as layers:
        layers = {k: v for k, v in layers.items() if k != id }
        with codecs.open(overlay_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(layers, ensure_ascii=False))

@contextmanager
def stand_layers():
    with codecs.open(stands_json, 'r', "utf-8") as file:
        yield json.load(file)   

def stand_update(layer_id, stand):
    with stand_layers() as layers:
        stands = layers.get(layer_id, {})
        stand_id = stand.get('id')
        if stand_id is None:
            stand_id = str(int(max(stands.keys())) + 1) if stands else '1'
        stand = dict(stand, id=stand_id)
        stands[stand_id] = stand
        layers[layer_id] = stands
        with codecs.open(stands_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(layers, ensure_ascii=False))
        return stand

def stand_delete(layer_id, stand_id):
    if layer_id is None or stand_id is None:
        return False
    layer_id = str(layer_id)
    with stand_layers() as layers:
        stands = layers.get(layer_id, {})
        stands = {k: v for k, v in stands.items() if k != stand_id }
        if not stands:
            if layer_id in layers:
                layers.pop(layer_id)
        else:
            layers[layer_id] = stands
        with codecs.open(stands_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(layers, ensure_ascii=False))
            return True

app = Flask(__name__, static_folder='')


@app.route('/')
@app.route('/index')
@app.route('/index.html')
def index():
  return app.send_static_file('index.html')


@app.route('/test')
@app.route('/test.html')
def test():
  return app.send_static_file('test.html')

@app.route('/dist/<path:path>')
def send_js(path):
    return send_from_directory('dist', path)

@app.route('/libs/<path:path>')
def send_lib_js(path):
    return send_from_directory('libs', path)

@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('css', path)

@app.route('/assets/<path:path>')
def send_data(path):
    return send_from_directory('assets', path)

#
# REST API
#

@app.route('/pavilions/')
def get_pavilions():
    with codecs.open(pavilions_json, 'r', "utf-8") as file:
        pavilions = json.load(file)
        return flask.jsonify(pavilions)

@app.route('/pavilions/<id>', methods=['POST'])
def update_pavilion(id):
    new_pavilion = json.loads(request.data)
    pavi = pavilion_update(id, new_pavilion)
    return flask.jsonify({"id": pavi['id']})

@app.route('/pavilions/<id>|delete', methods=['POST'])
def delete_pavilion(id):
    base_layers_delete(id)
    overlay_delete(id)
    pavilion_delete(id)
    return "ok"

@app.route('/bases/')
def bases():
    with base_layers() as bases:
        return flask.jsonify(bases)

@app.route('/pavilions/<id>/base/', methods=['POST'])
def update_base(id):
    base = json.loads(request.data)
    pavi = pavilion_by_id(id)
    if not pavi:
        return "Pavilion not found {}".format(id), 404
    base = base_layers_update(id, base)
    return flask.jsonify({"id": base['id']})

@app.route('/overlays/')
def overlay():
    with overlay_layers() as overlays:
        return flask.jsonify(overlays)

@app.route('/pavilions/<id>/overlay/', methods=['POST'])
def update_overlay(id):
    overlay = json.loads(request.data)
    pavi = pavilion_by_id(id)
    if not pavi:
        return "Pavilion not found {}".format(id), 404
    overlay = overlay_update(id, overlay)
    return flask.jsonify({"id": overlay['id']})


@app.route('/stands/')
def stands():
    with stand_layers() as stands:
        return flask.jsonify(stands)
    
@app.route('/stands/<stands_id>', methods=['POST'])
def update_stand(stands_id):
    stand = json.loads(request.data)
    stand = stand_update(stands_id, stand)
    return flask.jsonify(stand)

@app.route('/stands/<stands_id>/<stand_id>|delete', methods=['GET'])
def delete_stand(stands_id, stand_id):
    stand_delete(stands_id, stand_id)
    return flask.jsonify({"stands_id":stands_id, "stand_id":stand_id})







server = wsgi.WSGIServer(('127.0.0.1', 8080), application=app, log=None)
server.serve_forever()

