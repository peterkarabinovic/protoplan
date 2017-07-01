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


# Model
@contextmanager
def pavilions():
    with codecs.open(pavilions_json, 'r', "utf-8") as file:
        yield json.load(file)        

def pavilion_update(id, pavi):
    with pavilions() as pavis:
        if id == 0 or id == '0':
            pavilion = {}
            id = str(int(max(pavis.keys())) + 1) if pavis else 1
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
    with base_layers() as layers:
        layers = {k: v for k, v in layers.items() if k != id }
        with codecs.open(base_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(layers, ensure_ascii=False))

def base_layers_update(id, new_base):
    with base_layers() as layers:
        if id == 0 or id == '0':
            base = {}
            id = str(int(max(layers.keys())) + 1) if layers else 1
        else:
            base = layers.get(id, {})
        base = dict(base, **new_base)
        base['id'] = id
        layers[id] = base
        with codecs.open(base_json, 'w', 'utf-8') as json_file:
            json_file.write(json.dumps(layers, ensure_ascii=False))
        return base

    

app = Flask(__name__, static_folder='')


@app.route('/')
@app.route('/index')
@app.route('/index.html')
def index():
  return app.send_static_file('index.html')

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
    pavi = pavilion_by_id(id)
    base_layers_delete(pavi.get('base'))
    pavilion_delete(id)
    return "ok"


@app.route('/pavilions/<pavi_id>/base/<base_id>', methods=['POST'])
def update_base(pavi_id, base_id):
    base = json.loads(request.data)
    pavi = pavilion_by_id(pavi_id)
    if not pavi:
        return "Pavilion not found {}".format(pavi_id), 404
    base = base_layers_update(base_id, base)
    pavilion_update(pavi_id, {"base": base['id']})
    return flask.jsonify({"id": base['id']})





server = wsgi.WSGIServer(('127.0.0.1', 8080), application=app, log=None)
server.serve_forever()

