<script>
	import {itemDb, totalStats, activeItems} from './store';
	import Autocomplete from './Autocomplete.svelte';

	const e = ['cal','protein','fat','carb'];
    let amt = "";
	let val = "";
    let total_amt = 0;
    $: item_opts = ($itemDb).map(e => ({ name: e.name, text: e.desc}));
    $: total_amt_v = Number(total_amt);
    $: per_g_stats = {
            cal: $totalStats.cal / total_amt_v,
            protein: $totalStats.protein / total_amt_v,
            fat: $totalStats.fat / total_amt_v,
            carb: $totalStats.carb / total_amt_v,
        }
    $: {
        console.log(total_amt_v, per_g_stats, $totalStats);
    }
    
    function onClick() {
        if(!amt || !val) return;
        activeItems.update(u => u.concat({ name: val, amt: amt}));
        amt = '';
    }
    function onDel(name) {
        activeItems.update(u => {
            const cp = [...u];
            const idx = cp.map(d=>d.name).indexOf(name);
            cp.splice(idx, 1);
            return cp;
        })
    }
</script>

<div class="card">
    <div class="card-body">
        <h5 class="card-header">Add ingredients + weight</h5>
        <div class="row">
            <div class="col-lg-4">
                <Autocomplete 
                    placeholder="Ingredient" 
                    allOpts={item_opts}
                    onChange={(v) => {
                        val=v;
                    }}
                />
            </div>
            <div class="col-lg-2">
                <input type="number" class="form-control" 
                    bind:value={amt} placeholder="Amount, g"
                />
            </div>
            <div class="col-lg-2">
                <button type="button" class="btn btn-primary" 
                    on:click={onClick}
                >Add</button>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <ul class="list-group opts">
                {#each $activeItems as i}
                    <li class="list-group-item"><button class="btn btn-danger" on:click={() => onDel(i.name)}>X</button>&emsp;{i.name} ({i.amt} g) </li>
                {/each}
            </ul>
        </div>
    </div>
</div>
<div class="card">
    <div class="card-body">
        <div class="row">
            <div class="col">
                <h5 class="card-header">Current stats:</h5>
                <h6>Set total weight</h6>
                <input type="number" class="form-control"
                    bind:value={total_amt} placeholder="Total dish amount, g" />
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Cals / g</th>
                            <th>Protein (g)</th>
                            <th>Fat (g)</th>
                            <th>Carbs (g)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {#each e as i}
                            <th>{per_g_stats[i] ? per_g_stats[i].toFixed(3) : 'N/A'}</th>
                            {/each}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>