import { writable } from 'svelte/store';
import dat from './itemDb.json';

function getStoredItems() {
    const items = localStorage.getItem("itemDb");
    console.log(items);
    if(items) {
        return JSON.parse(items);
    }
    console.log(dat);
    return dat;
};
export const itemDb = writable(getStoredItems());
itemDb.subscribe(value => {
    localStorage.setItem("itemDb", JSON.stringify(value));
});