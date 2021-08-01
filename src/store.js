import { writable } from 'svelte/store';
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
export const itemDb = writable(getStored('itemDb',dat));
itemDb.subscribe(value => setStored(value,'itemDb'));

// active calculator stuff
export const activeItems = writable(getStored('activeItems',[]));
activeItems.subscribe(value => setStored(value,'activeItems'));
