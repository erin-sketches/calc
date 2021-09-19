
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.41.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var dat = [
    	{
    		desc: "Nasoya extra firm tofu",
    		name: "tofu",
    		cal: 80,
    		gram: 85,
    		protein: 8,
    		fat: 5,
    		carb: 2
    	},
    	{
    		desc: "White onions, raw",
    		name: "onions (white)",
    		cal: 36,
    		gram: 100,
    		protein: 0.89,
    		fat: 0.13,
    		carb: 7.68
    	},
    	{
    		desc: "Gala apple",
    		name: "apple (gala)",
    		cal: 61,
    		gram: 100,
    		protein: 0.13,
    		fat: 0.15,
    		carb: 14.8
    	},
    	{
    		desc: "Calories (uncategorized)",
    		name: "calories",
    		cal: 1,
    		gram: 1,
    		protein: 0,
    		fat: 0,
    		carb: 0
    	},
    	{
    		desc: "Peanut butter (Skippy, creamy)",
    		name: "peanut butter (creamy)",
    		cal: 190,
    		gram: 32,
    		protein: 7,
    		fat: 16,
    		carb: 6
    	},
    	{
    		desc: "Hoisin (Lee Kum Kee)",
    		name: "hoisin",
    		cal: 90,
    		gram: 42,
    		protein: 0,
    		fat: 0,
    		carb: 21
    	},
    	{
    		desc: "Cucumber",
    		name: "cucumber",
    		cal: 15,
    		gram: 100,
    		protein: 0.65,
    		fat: 0.11,
    		carb: 3.63
    	},
    	{
    		desc: "Oil (1 tbsp = 13.63 g)",
    		name: "oil",
    		cal: 884,
    		gram: 100,
    		protein: 0,
    		fat: 100,
    		carb: 0
    	},
    	{
    		desc: "Garlic",
    		name: "garlic",
    		cal: 143,
    		gram: 100,
    		protein: 6.62,
    		fat: 0.38,
    		carb: 28.2
    	},
    	{
    		desc: "Kale",
    		name: "kale",
    		cal: 43,
    		gram: 100,
    		protein: 2.92,
    		fat: 1.49,
    		carb: 4.42
    	},
    	{
    		desc: "Tomato",
    		name: "tomato",
    		cal: 22,
    		gram: 100,
    		protein: 0.7,
    		fat: 0.42,
    		carb: 3.84
    	},
    	{
    		desc: "Better Than Boullion paste (1 tsp = 6g)",
    		name: "better than boullion stock",
    		cal: 10,
    		gram: 6,
    		protein: 0,
    		fat: 0,
    		carb: 2
    	},
    	{
    		desc: "Russet Potato",
    		name: "russet potato",
    		cal: 79,
    		gram: 100,
    		protein: 2,
    		fat: 0,
    		carb: 18
    	},
    	{
    		desc: "Carrot",
    		name: "carrot",
    		cal: 41,
    		gram: 100,
    		protein: 0.93,
    		fat: 0,
    		carb: 9.58
    	},
    	{
    		desc: "Impossible beef",
    		name: "impossible beef",
    		cal: 240,
    		gram: 113,
    		protein: 19,
    		fat: 14,
    		carb: 9
    	},
    	{
    		desc: "Golden Curry Block (Hot) (216g = whole 12 servings)",
    		name: "golden curry",
    		cal: 90,
    		gram: 18,
    		protein: 1,
    		fat: 4.5,
    		carb: 10
    	},
    	{
    		desc: "Canned corn, with liquid (432g = whole can)",
    		name: "canned corn",
    		cal: 60,
    		gram: 125,
    		protein: 1,
    		fat: 1,
    		carb: 13
    	}
    ];

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
    const itemDb = writable(dat);
    itemDb.subscribe(value => setStored(value,'itemDb'));
    const itemLookup = derived(itemDb, 
        $itemDb => {
            const d = {};
            for(let i of $itemDb) {
                d[i.name] = i;
            }
            return d;
        }
    );

    // active calculator stuff
    const activeItems = writable(getStored('activeItems',[]));
    activeItems.subscribe(value => setStored(value,'activeItems'));

    // stats
    const totalStats = derived([itemLookup, activeItems],
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
    );

    /* src/ItemTable.svelte generated by Svelte v3.41.0 */
    const file$3 = "src/ItemTable.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (31:12) {#each e as i}
    function create_each_block_1$1(ctx) {
    	let th;

    	let t_value = (/*item*/ ctx[2][/*i*/ ctx[5]]
    	? (/*item*/ ctx[2][/*i*/ ctx[5]] / /*item*/ ctx[2].gram).toFixed(3)
    	: '--') + "";

    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			add_location(th, file$3, 31, 16, 673);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$itemDb*/ 1 && t_value !== (t_value = (/*item*/ ctx[2][/*i*/ ctx[5]]
    			? (/*item*/ ctx[2][/*i*/ ctx[5]] / /*item*/ ctx[2].gram).toFixed(3)
    			: '--') + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(31:12) {#each e as i}",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#each $itemDb as item}
    function create_each_block$2(ctx) {
    	let tr;
    	let th0;
    	let t0_value = /*item*/ ctx[2].desc + "";
    	let t0;
    	let t1;
    	let th1;
    	let t2_value = (/*item*/ ctx[2].cal / /*item*/ ctx[2].gram).toFixed(3) + "";
    	let t2;
    	let t3;
    	let t4;
    	let each_value_1 = /*e*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			th0 = element("th");
    			t0 = text(t0_value);
    			t1 = space();
    			th1 = element("th");
    			t2 = text(t2_value);
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			add_location(th0, file$3, 28, 16, 550);
    			add_location(th1, file$3, 29, 16, 587);
    			add_location(tr, file$3, 27, 12, 529);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, th0);
    			append_dev(th0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(th1, t2);
    			append_dev(tr, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$itemDb*/ 1 && t0_value !== (t0_value = /*item*/ ctx[2].desc + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$itemDb*/ 1 && t2_value !== (t2_value = (/*item*/ ctx[2].cal / /*item*/ ctx[2].gram).toFixed(3) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$itemDb, e*/ 3) {
    				each_value_1 = /*e*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t4);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(27:4) {#each $itemDb as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let th4;
    	let t9;
    	let tbody;
    	let each_value = /*$itemDb*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Cals / g";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Protein (g)";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Fat (g)";
    			t7 = space();
    			th4 = element("th");
    			th4.textContent = "Carbs (g)";
    			t9 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(th0, file$3, 8, 12, 163);
    			add_location(th1, file$3, 11, 12, 219);
    			add_location(th2, file$3, 14, 12, 279);
    			add_location(th3, file$3, 17, 12, 342);
    			add_location(th4, file$3, 20, 12, 401);
    			add_location(tr, file$3, 7, 8, 146);
    			add_location(thead, file$3, 6, 4, 130);
    			add_location(tbody, file$3, 25, 4, 481);
    			attr_dev(table, "class", "table table-striped");
    			add_location(table, file$3, 5, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(tr, t5);
    			append_dev(tr, th3);
    			append_dev(tr, t7);
    			append_dev(tr, th4);
    			append_dev(table, t9);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*e, $itemDb*/ 3) {
    				each_value = /*$itemDb*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $itemDb;
    	validate_store(itemDb, 'itemDb');
    	component_subscribe($$self, itemDb, $$value => $$invalidate(0, $itemDb = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ItemTable', slots, []);
    	const e = ['protein', 'fat', 'carb'];
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ItemTable> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ itemDb, e, $itemDb });
    	return [$itemDb, e];
    }

    class ItemTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ItemTable",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Autocomplete.svelte generated by Svelte v3.41.0 */

    const file$2 = "src/Autocomplete.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (29:4) {#if showOpts}
    function create_if_block(ctx) {
    	let ul;
    	let each_value = /*opts*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "list-group opts svelte-wwylds");
    			add_location(ul, file$2, 29, 8, 717);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*onChange, opts, q, showOpts*/ 30) {
    				each_value = /*opts*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:4) {#if showOpts}",
    		ctx
    	});

    	return block;
    }

    // (31:8) {#each opts as opt}
    function create_each_block$1(ctx) {
    	let li;
    	let t_value = /*opt*/ ctx[11].text + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*opt*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$2, 31, 12, 786);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*opts*/ 16 && t_value !== (t_value = /*opt*/ ctx[11].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(31:8) {#each opts as opt}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let input;
    	let t;
    	let mounted;
    	let dispose;
    	let if_block = /*showOpts*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			add_location(input, file$2, 22, 4, 515);
    			add_location(div, file$2, 18, 0, 438);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*q*/ ctx[2]);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(input, "focus", /*focus_handler*/ ctx[7], false, false, false),
    					listen_dev(
    						input,
    						"change",
    						function () {
    							if (is_function(/*onChange*/ ctx[1](/*q*/ ctx[2]))) /*onChange*/ ctx[1](/*q*/ ctx[2]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(div, "blur", /*blur_handler*/ ctx[9], false, false, false),
    					listen_dev(div, "focus", /*focus_handler_1*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*placeholder*/ 1) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[0]);
    			}

    			if (dirty & /*q*/ 4 && input.value !== /*q*/ ctx[2]) {
    				set_input_value(input, /*q*/ ctx[2]);
    			}

    			if (/*showOpts*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let opts;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Autocomplete', slots, []);
    	let { placeholder } = $$props;
    	let { allOpts } = $$props;
    	let { onChange } = $$props;

    	/** state **/
    	// current query
    	let q = "";

    	// whether or not to show the option dropdown
    	let showOpts = false;

    	const writable_props = ['placeholder', 'allOpts', 'onChange'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Autocomplete> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		q = this.value;
    		$$invalidate(2, q);
    	}

    	const focus_handler = () => $$invalidate(3, showOpts = true);

    	const click_handler = opt => {
    		onChange(opt.name);
    		$$invalidate(2, q = opt.name);
    		$$invalidate(3, showOpts = false);
    	};

    	const blur_handler = () => $$invalidate(3, showOpts = false);
    	const focus_handler_1 = () => $$invalidate(3, showOpts = true);

    	$$self.$$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ('allOpts' in $$props) $$invalidate(5, allOpts = $$props.allOpts);
    		if ('onChange' in $$props) $$invalidate(1, onChange = $$props.onChange);
    	};

    	$$self.$capture_state = () => ({
    		placeholder,
    		allOpts,
    		onChange,
    		q,
    		showOpts,
    		opts
    	});

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate(0, placeholder = $$props.placeholder);
    		if ('allOpts' in $$props) $$invalidate(5, allOpts = $$props.allOpts);
    		if ('onChange' in $$props) $$invalidate(1, onChange = $$props.onChange);
    		if ('q' in $$props) $$invalidate(2, q = $$props.q);
    		if ('showOpts' in $$props) $$invalidate(3, showOpts = $$props.showOpts);
    		if ('opts' in $$props) $$invalidate(4, opts = $$props.opts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*allOpts, q*/ 36) {
    			// current downselected options
    			$$invalidate(4, opts = allOpts.filter(v => v.name.toLowerCase().includes(q.toLowerCase())));
    		}
    	};

    	return [
    		placeholder,
    		onChange,
    		q,
    		showOpts,
    		opts,
    		allOpts,
    		input_input_handler,
    		focus_handler,
    		click_handler,
    		blur_handler,
    		focus_handler_1
    	];
    }

    class Autocomplete extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { placeholder: 0, allOpts: 5, onChange: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Autocomplete",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*placeholder*/ ctx[0] === undefined && !('placeholder' in props)) {
    			console.warn("<Autocomplete> was created without expected prop 'placeholder'");
    		}

    		if (/*allOpts*/ ctx[5] === undefined && !('allOpts' in props)) {
    			console.warn("<Autocomplete> was created without expected prop 'allOpts'");
    		}

    		if (/*onChange*/ ctx[1] === undefined && !('onChange' in props)) {
    			console.warn("<Autocomplete> was created without expected prop 'onChange'");
    		}
    	}

    	get placeholder() {
    		throw new Error("<Autocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Autocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get allOpts() {
    		throw new Error("<Autocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set allOpts(value) {
    		throw new Error("<Autocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onChange() {
    		throw new Error("<Autocomplete>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onChange(value) {
    		throw new Error("<Autocomplete>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Calc.svelte generated by Svelte v3.41.0 */

    const { console: console_1 } = globals;
    const file$1 = "src/Calc.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    // (64:16) {#each $activeItems as i}
    function create_each_block_1(ctx) {
    	let li;
    	let button;
    	let t1;
    	let t2_value = /*i*/ ctx[16].name + "";
    	let t2;
    	let t3;
    	let t4_value = /*i*/ ctx[16].amt + "";
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[14](/*i*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			button.textContent = "X";
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = text(" (");
    			t4 = text(t4_value);
    			t5 = text(" g) ");
    			attr_dev(button, "class", "btn btn-danger");
    			add_location(button, file$1, 64, 48, 2027);
    			attr_dev(li, "class", "list-group-item");
    			add_location(li, file$1, 64, 20, 1999);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(li, t1);
    			append_dev(li, t2);
    			append_dev(li, t3);
    			append_dev(li, t4);
    			append_dev(li, t5);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$activeItems*/ 32 && t2_value !== (t2_value = /*i*/ ctx[16].name + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$activeItems*/ 32 && t4_value !== (t4_value = /*i*/ ctx[16].amt + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(64:16) {#each $activeItems as i}",
    		ctx
    	});

    	return block;
    }

    // (90:28) {#each e as i}
    function create_each_block(ctx) {
    	let th;

    	let t_value = (/*per_g_stats*/ ctx[1][/*i*/ ctx[16]]
    	? /*per_g_stats*/ ctx[1][/*i*/ ctx[16]].toFixed(3)
    	: 'N/A') + "";

    	let t;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			add_location(th, file$1, 90, 28, 3034);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*per_g_stats*/ 2 && t_value !== (t_value = (/*per_g_stats*/ ctx[1][/*i*/ ctx[16]]
    			? /*per_g_stats*/ ctx[1][/*i*/ ctx[16]].toFixed(3)
    			: 'N/A') + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(90:28) {#each e as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div7;
    	let div4;
    	let h50;
    	let t1;
    	let div3;
    	let div0;
    	let autocomplete;
    	let t2;
    	let div1;
    	let input0;
    	let t3;
    	let div2;
    	let button;
    	let t5;
    	let div6;
    	let div5;
    	let ul;
    	let t6;
    	let div11;
    	let div10;
    	let div9;
    	let div8;
    	let h51;
    	let t8;
    	let h6;
    	let t10;
    	let input1;
    	let t11;
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let t13;
    	let th1;
    	let t15;
    	let th2;
    	let t17;
    	let th3;
    	let t19;
    	let tbody;
    	let tr1;
    	let current;
    	let mounted;
    	let dispose;

    	autocomplete = new Autocomplete({
    			props: {
    				placeholder: "Ingredient",
    				allOpts: /*item_opts*/ ctx[4],
    				onChange: /*func*/ ctx[12]
    			},
    			$$inline: true
    		});

    	let each_value_1 = /*$activeItems*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*e*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div4 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Add ingredients + weight";
    			t1 = space();
    			div3 = element("div");
    			div0 = element("div");
    			create_component(autocomplete.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t3 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Add";
    			t5 = space();
    			div6 = element("div");
    			div5 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Current stats:";
    			t8 = space();
    			h6 = element("h6");
    			h6.textContent = "Set total weight";
    			t10 = space();
    			input1 = element("input");
    			t11 = space();
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "Cals / g";
    			t13 = space();
    			th1 = element("th");
    			th1.textContent = "Protein (g)";
    			t15 = space();
    			th2 = element("th");
    			th2.textContent = "Fat (g)";
    			t17 = space();
    			th3 = element("th");
    			th3.textContent = "Carbs (g)";
    			t19 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h50, "class", "card-header");
    			add_location(h50, file$1, 37, 8, 1080);
    			attr_dev(div0, "class", "col-lg-4");
    			add_location(div0, file$1, 39, 12, 1172);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "placeholder", "Amount, g");
    			add_location(input0, file$1, 49, 16, 1494);
    			attr_dev(div1, "class", "col-lg-2");
    			add_location(div1, file$1, 48, 12, 1455);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file$1, 54, 16, 1687);
    			attr_dev(div2, "class", "col-lg-2");
    			add_location(div2, file$1, 53, 12, 1648);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$1, 38, 8, 1142);
    			attr_dev(div4, "class", "card-body");
    			add_location(div4, file$1, 36, 4, 1048);
    			attr_dev(ul, "class", "list-group opts");
    			add_location(ul, file$1, 62, 12, 1908);
    			attr_dev(div5, "class", "col");
    			add_location(div5, file$1, 61, 8, 1878);
    			attr_dev(div6, "class", "row");
    			add_location(div6, file$1, 60, 4, 1852);
    			attr_dev(div7, "class", "card");
    			add_location(div7, file$1, 35, 0, 1025);
    			attr_dev(h51, "class", "card-header");
    			add_location(h51, file$1, 74, 16, 2326);
    			add_location(h6, file$1, 75, 16, 2386);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "placeholder", "Total dish amount, g");
    			add_location(input1, file$1, 76, 16, 2428);
    			add_location(th0, file$1, 81, 28, 2688);
    			add_location(th1, file$1, 82, 28, 2734);
    			add_location(th2, file$1, 83, 28, 2783);
    			add_location(th3, file$1, 84, 28, 2828);
    			add_location(tr0, file$1, 80, 24, 2655);
    			add_location(thead, file$1, 79, 20, 2623);
    			add_location(tr1, file$1, 88, 24, 2958);
    			add_location(tbody, file$1, 87, 20, 2926);
    			attr_dev(table, "class", "table table-striped");
    			add_location(table, file$1, 78, 16, 2567);
    			attr_dev(div8, "class", "col");
    			add_location(div8, file$1, 73, 12, 2292);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$1, 72, 8, 2262);
    			attr_dev(div10, "class", "card-body");
    			add_location(div10, file$1, 71, 4, 2230);
    			attr_dev(div11, "class", "card");
    			add_location(div11, file$1, 70, 0, 2207);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div4);
    			append_dev(div4, h50);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			mount_component(autocomplete, div0, null);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*amt*/ ctx[2]);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, ul);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul, null);
    			}

    			insert_dev(target, t6, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, h51);
    			append_dev(div8, t8);
    			append_dev(div8, h6);
    			append_dev(div8, t10);
    			append_dev(div8, input1);
    			set_input_value(input1, /*total_amt*/ ctx[0]);
    			append_dev(div8, t11);
    			append_dev(div8, table);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t13);
    			append_dev(tr0, th1);
    			append_dev(tr0, t15);
    			append_dev(tr0, th2);
    			append_dev(tr0, t17);
    			append_dev(tr0, th3);
    			append_dev(table, t19);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[13]),
    					listen_dev(button, "click", /*onClick*/ ctx[7], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const autocomplete_changes = {};
    			if (dirty & /*item_opts*/ 16) autocomplete_changes.allOpts = /*item_opts*/ ctx[4];
    			if (dirty & /*val*/ 8) autocomplete_changes.onChange = /*func*/ ctx[12];
    			autocomplete.$set(autocomplete_changes);

    			if (dirty & /*amt*/ 4 && to_number(input0.value) !== /*amt*/ ctx[2]) {
    				set_input_value(input0, /*amt*/ ctx[2]);
    			}

    			if (dirty & /*$activeItems, onDel*/ 288) {
    				each_value_1 = /*$activeItems*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*total_amt*/ 1 && to_number(input1.value) !== /*total_amt*/ ctx[0]) {
    				set_input_value(input1, /*total_amt*/ ctx[0]);
    			}

    			if (dirty & /*per_g_stats, e*/ 66) {
    				each_value = /*e*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(autocomplete.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(autocomplete.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(autocomplete);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div11);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let item_opts;
    	let total_amt_v;
    	let per_g_stats;
    	let $totalStats;
    	let $itemDb;
    	let $activeItems;
    	validate_store(totalStats, 'totalStats');
    	component_subscribe($$self, totalStats, $$value => $$invalidate(10, $totalStats = $$value));
    	validate_store(itemDb, 'itemDb');
    	component_subscribe($$self, itemDb, $$value => $$invalidate(11, $itemDb = $$value));
    	validate_store(activeItems, 'activeItems');
    	component_subscribe($$self, activeItems, $$value => $$invalidate(5, $activeItems = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Calc', slots, []);
    	const e = ['cal', 'protein', 'fat', 'carb'];
    	let amt = "";
    	let val = "";
    	let total_amt = 0;

    	function onClick() {
    		if (!amt || !val) return;
    		activeItems.update(u => u.concat({ name: val, amt }));
    		$$invalidate(2, amt = '');
    	}

    	function onDel(name) {
    		activeItems.update(u => {
    			const cp = [...u];
    			const idx = cp.map(d => d.name).indexOf(name);
    			cp.splice(idx, 1);
    			return cp;
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Calc> was created with unknown prop '${key}'`);
    	});

    	const func = v => {
    		$$invalidate(3, val = v);
    	};

    	function input0_input_handler() {
    		amt = to_number(this.value);
    		$$invalidate(2, amt);
    	}

    	const click_handler = i => onDel(i.name);

    	function input1_input_handler() {
    		total_amt = to_number(this.value);
    		$$invalidate(0, total_amt);
    	}

    	$$self.$capture_state = () => ({
    		itemDb,
    		totalStats,
    		activeItems,
    		Autocomplete,
    		e,
    		amt,
    		val,
    		total_amt,
    		onClick,
    		onDel,
    		per_g_stats,
    		total_amt_v,
    		item_opts,
    		$totalStats,
    		$itemDb,
    		$activeItems
    	});

    	$$self.$inject_state = $$props => {
    		if ('amt' in $$props) $$invalidate(2, amt = $$props.amt);
    		if ('val' in $$props) $$invalidate(3, val = $$props.val);
    		if ('total_amt' in $$props) $$invalidate(0, total_amt = $$props.total_amt);
    		if ('per_g_stats' in $$props) $$invalidate(1, per_g_stats = $$props.per_g_stats);
    		if ('total_amt_v' in $$props) $$invalidate(9, total_amt_v = $$props.total_amt_v);
    		if ('item_opts' in $$props) $$invalidate(4, item_opts = $$props.item_opts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$itemDb*/ 2048) {
    			$$invalidate(4, item_opts = $itemDb.map(e => ({ name: e.name, text: e.desc })));
    		}

    		if ($$self.$$.dirty & /*total_amt*/ 1) {
    			$$invalidate(9, total_amt_v = Number(total_amt));
    		}

    		if ($$self.$$.dirty & /*$totalStats, total_amt_v*/ 1536) {
    			$$invalidate(1, per_g_stats = {
    				cal: $totalStats.cal / total_amt_v,
    				protein: $totalStats.protein / total_amt_v,
    				fat: $totalStats.fat / total_amt_v,
    				carb: $totalStats.carb / total_amt_v
    			});
    		}

    		if ($$self.$$.dirty & /*total_amt_v, per_g_stats, $totalStats*/ 1538) {
    			{
    				console.log(total_amt_v, per_g_stats, $totalStats);
    			}
    		}
    	};

    	return [
    		total_amt,
    		per_g_stats,
    		amt,
    		val,
    		item_opts,
    		$activeItems,
    		e,
    		onClick,
    		onDel,
    		total_amt_v,
    		$totalStats,
    		$itemDb,
    		func,
    		input0_input_handler,
    		click_handler,
    		input1_input_handler
    	];
    }

    class Calc extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Calc",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.41.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let calc;
    	let t0;
    	let br0;
    	let t1;
    	let hr;
    	let t2;
    	let br1;
    	let t3;
    	let itemtable;
    	let current;
    	calc = new Calc({ $$inline: true });
    	itemtable = new ItemTable({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(calc.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			br1 = element("br");
    			t3 = space();
    			create_component(itemtable.$$.fragment);
    			add_location(br0, file, 7, 1, 118);
    			add_location(hr, file, 8, 1, 126);
    			add_location(br1, file, 9, 1, 134);
    			add_location(main, file, 5, 0, 100);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(calc, main, null);
    			append_dev(main, t0);
    			append_dev(main, br0);
    			append_dev(main, t1);
    			append_dev(main, hr);
    			append_dev(main, t2);
    			append_dev(main, br1);
    			append_dev(main, t3);
    			mount_component(itemtable, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(calc.$$.fragment, local);
    			transition_in(itemtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(calc.$$.fragment, local);
    			transition_out(itemtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(calc);
    			destroy_component(itemtable);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ItemTable, Calc });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
