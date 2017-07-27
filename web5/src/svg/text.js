import {str} from '../utils/utils.js'

export function textDocument(text, style)
{
    style = style || {};
    'Times, serif'
    return str('<?xml version="1.0" encoding="utf-8"?>',
               '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">',
               '<text x="0" y="20" fill="{fill}" font-family="{font-family}" ',
               'font-style="{font-style}" font-size="{font-size}">{text}</text>',
                '</svg>').replace('{fill}', style.fill || 'grey')
                         .replace('{font-family}', style['font-family'] || 'Times')
                         .replace('{font-size}', style['font-size'] || '1pt')
                         .replace('{font-style}', style['font-style'] || 'normal')
                         .replace('{text}', text);
}
