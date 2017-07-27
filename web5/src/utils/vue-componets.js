import {str} from './utils.js'

export function initComponents()
{

    Vue.component('folding', {
        props: ['title', 'open'],

        template: str('<div style="cursor: pointer;">',
                    '<span @click="on_click" style="margin-left: -1.2em" class="w3-text-grey">',
                    '<i  style="margin-right: 0.4em" class="material-icons">{{icon}}</i>',
                    '{{title}}</span>',
                    '<div v-show="is_open"><slot></slot></div>',
                  '</div>'),

        data: function(){
            return {
                is_open: this.open == 'true'
            }
        },
        computed: {
            icon: function(){
                return ['chevron_right', 'expand_more'][+this.is_open];
            }
        },
        methods: {
            on_click: function(){
                this.is_open = !this.is_open;
            }
        }
    })

}