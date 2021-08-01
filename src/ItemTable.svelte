<script>
	import {itemDb} from './store';
	const e = ['protein','fat','carb'];
</script>

<table class="table table-striped">
    <thead>
        <tr>
            <th>
                Name
            </th>
            <th>
                Cals / g
            </th>
            <th>
                Protein (g)
            </th>
            <th>
                Fat (g)
            </th>
            <th>
                Carbs (g)
            </th>
        </tr>
    </thead>
    <tbody>
    {#each $itemDb as item}
            <tr>
                <th>{item.desc}</th>
                <th>{(item.cal/item.gram).toFixed(3)}</th>
            {#each e as i}
                <th>{item[i] ? (item[i]/item.gram).toFixed(3) : '--'}</th>
            {/each}
            </tr>
    {/each}
    </tbody>
</table>