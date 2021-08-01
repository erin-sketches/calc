<script>
	import ItemTable from './ItemTable.svelte';
	import Autocomplete from './Autocomplete.svelte';
	import {itemDb} from './store';

	console.log(itemDb);
	$: item_opts = ($itemDb).map(e => ({ name: e.name, text: e.name}));

	let val = 'None';
	function onChange(v) {
		val = v;
	}
</script>

<main>
	<div>
		Value: {val}
	</div>
	<Autocomplete 
		placeholder="Ingredient" 
		allOpts={item_opts}
		onChange={onChange}
	/>
	<ItemTable />
</main>