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
    on:blur={()=>{showOpts=false;}}
    on:click={()=>{showOpts=true;}}
    on:focus={()=>{showOpts=true;}}
>
<input type="text" class="form-control" 
    bind:value={q}
    placeholder={placeholder} 
/>
{#if showOpts}
    <ul class="list-group opts">
    {#each opts as opt}
        <li class="list-group-item" on:click={() => {
            console.log(opt);
            onChange(opt.name);
        }}>{opt.text}</li>
    {/each}
    </ul>
{/if}
</div>
<style>
    .opts {
        z-index: 999;
    }
</style>