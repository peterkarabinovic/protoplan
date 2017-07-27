import {PAVILION_ADD, PAVILION_DELETE, PAVILION_SELECT} from '../../actions.js'
import {selectedPavilion} from '../../state.js'

export default function (store) 
{
    var vm = new Vue({
        el: "#pavilion",
        template: '#pavilion-template',
        data: {
            pavilions: store.prop('pavilions'),
            selectedPavilion: store.prop('selectedPavilion')
        },
        methods: {
            addPavilion: function(){
                var name = prompt("Название:").trim();
                if(name.length) 
                    store(PAVILION_ADD, {name: name, id:0});
            },
            deletePavilion: function(pavi){
                if(confirm('Удалить павильон "'+pavi.name+'"?'))
                    store(PAVILION_DELETE, pavi);
            },
            selectPavilion: function(pavi){
                store(PAVILION_SELECT, pavi);
            },
            isSelected: function(pavi){
                return _.isEqual(pavi,  this.selectedPavilion.$val);
            }

        }        
    });

    var vm2 = new Vue({
        el: '#pavilion-layers',
        data: { 
            selectedPavilion: store.prop('selectedPavilion'),
            hasBase: store.prop('selectedBase.url')
        }
    });

    var vm3 = new Vue({
        el: '#error',
        data: { error: store.prop('ui.error') }
    });
    
}