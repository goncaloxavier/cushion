const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".DS_Store",".gitkeep","favicon.svg","images/blog-editorial.png","images/case-installation.png","images/product-materials.png","images/recycled-products-hero.png","logo/brand_mark.png"]),
	mimeTypes: {".svg":"image/svg+xml",".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.Dc1uZ2IK.js",app:"_app/immutable/entry/app.nIrKSb8I.js",imports:["_app/immutable/entry/start.Dc1uZ2IK.js","_app/immutable/chunks/DdtrTdbr.js","_app/immutable/chunks/nMsXWAX_.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/entry/app.nIrKSb8I.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/nMsXWAX_.js","_app/immutable/chunks/oTvUSImd.js","_app/immutable/chunks/BDUFQZCt.js","_app/immutable/chunks/DmJIVTYp.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./chunks/0-DtmfWFW2.js')),
			__memo(() => import('./chunks/1-DjbkS540.js')),
			__memo(() => import('./chunks/2-D7uXuZZK.js')),
			__memo(() => import('./chunks/3-BhpvURbx.js')),
			__memo(() => import('./chunks/4-BP7YtLpg.js')),
			__memo(() => import('./chunks/5-BQFudrkJ.js')),
			__memo(() => import('./chunks/6-DJbspXIV.js')),
			__memo(() => import('./chunks/7-N05XRmr8.js')),
			__memo(() => import('./chunks/8-DqsLe4GI.js')),
			__memo(() => import('./chunks/9-DvnDg05G.js')),
			__memo(() => import('./chunks/10-CrVJVoCc.js')),
			__memo(() => import('./chunks/11-BNyW-wgq.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/blog",
				pattern: /^\/blog\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/blog/[slug]",
				pattern: /^\/blog\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/casos-de-estudo",
				pattern: /^\/casos-de-estudo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/casos-de-estudo/[slug]",
				pattern: /^\/casos-de-estudo\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			},
			{
				id: "/catalogo",
				pattern: /^\/catalogo\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 7 },
				endpoint: null
			},
			{
				id: "/contacto",
				pattern: /^\/contacto\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 8 },
				endpoint: null
			},
			{
				id: "/produtos",
				pattern: /^\/produtos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 9 },
				endpoint: null
			},
			{
				id: "/produtos/[slug]",
				pattern: /^\/produtos\/([^/]+?)\/?$/,
				params: [{"name":"slug","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 10 },
				endpoint: null
			},
			{
				id: "/sobre-nos",
				pattern: /^\/sobre-nos\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 11 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
