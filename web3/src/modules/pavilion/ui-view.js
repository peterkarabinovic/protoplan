import {PAVILION_ADD, PAVILION_DELETE, PAVILION_SELECT} from '../../actions.js'
import {selectedPavilion} from '../../state.js'

export default function (store) 
{
    var vm = new Vue({
        el: "#pavilion",
        template: '#pavilion-template',
        data: {
            pavilions: _.values(store.state.pavilions),
            selectedPavilion: _.clone(store.state.selectedPavilion || {})
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
                return _.isEqual(pavi,  this.selectedPavilion);
            }

        }        
    });

    store.on('pavilions', function(e){
        vm.pavilions = _.values(e.new_val);
    })

    store.on('selectedPavilion', function(e){
        vm.selectedPavilion = e.new_val;
    })


    var vm2 = new Vue({
        el: '#pavilion-layers',
        data: { selectedPavilion: store.state.selectedPavilion}
    });

    store.on('selectedPavilion', function(e){
        vm2.selectedPavilion = e.new_val;
    })
}