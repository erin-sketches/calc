import { derived, writable } from 'svelte/store';
import dat from './itemDb.json';

// helpers to get/set from storage
function getStored(key, init_value) {
    const d = localStorage.getItem(key);
    if(d) return JSON.parse(d);
    return init_value;
}
function setStored(value, key) {
    localStorage.setItem(key, JSON.stringify(value));
}

// item database
export const itemDb = writable(dat);
itemDb.subscribe(value => setStored(value,'itemDb'));
export const itemLookup = derived(itemDb, 
    $itemDb => {
        const d = {};
        for(let i of $itemDb) {
            d[i.name] = i;
        }
        return d;
    }
);

// active calculator stuff
export const activeItems = writable(getStored('activeItems',[]));
activeItems.subscribe(value => setStored(value,'activeItems'));

// stats
export const totalStats = derived([itemLookup, activeItems],
    ([$itemLookup, $activeItems]) => {
        console.log('totalstats',$itemLookup, $activeItems);
        const d = { cal: 0, gram: 0, protein: 0, fat: 0, carb: 0 };
	    const res = $activeItems.reduce((acc, val) => {
            const {name, amt} = val;
            if(!$itemLookup[name]) return acc;
            const i = $itemLookup[name];
            const mul = Number(amt) / i.gram;
            return {
                cal: acc.cal + i.cal*mul,
                protein: acc.protein + i.protein*mul,
                fat: acc.fat + i.fat*mul,
                carb: acc.carb + i.carb*mul
            }
        }, d);
        return res;
    }
)