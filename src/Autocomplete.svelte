<script>
/** props **/
// placeholder text
export let placeholder;
// options, in form [{name: foo, text: bar}, {...}]
export let allOpts;
// callback to pass in the selected value
export let onChange;

/** state **/
// current query
let q = "";
// current downselected options
$: opts = allOpts.filter((v) => v.name.toLowerCase().includes(q.toLowerCase()));
// whether or not to show the option dropdown
let showOpts = false;
</script>

<div
    on:blur={()=>showOpts=false}
    on:focus={()=>showOpts=true}
>
    <input type="text" class="form-control" 
        bind:value={q}
        on:focus={()=>showOpts=true}
        on:change={onChange(q)}
        placeholder={placeholder} 
    />
    {#if showOpts}
        <ul class="list-group opts">
        {#each opts as opt}
            <li class="list-group-item" on:click={() => {
                onChange(opt.name);
                q = opt.name;
                showOpts = false;
            }}>{opt.text}</li>
        {/each}
        </ul>
    {/if}
</div>
<style>
    .opts {
        z-index: 999;
        position: absolute;
        min-width: 100px;
    }
</style>