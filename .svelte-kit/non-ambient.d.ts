
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/blog" | "/blog/[slug]" | "/casos-de-estudo" | "/casos-de-estudo/[slug]" | "/catalogo" | "/contacto" | "/produtos" | "/produtos/[slug]" | "/sobre-nos";
		RouteParams(): {
			"/blog/[slug]": { slug: string };
			"/casos-de-estudo/[slug]": { slug: string };
			"/produtos/[slug]": { slug: string }
		};
		LayoutParams(): {
			"/": { slug?: string };
			"/blog": { slug?: string };
			"/blog/[slug]": { slug: string };
			"/casos-de-estudo": { slug?: string };
			"/casos-de-estudo/[slug]": { slug: string };
			"/catalogo": Record<string, never>;
			"/contacto": Record<string, never>;
			"/produtos": { slug?: string };
			"/produtos/[slug]": { slug: string };
			"/sobre-nos": Record<string, never>
		};
		Pathname(): "/" | "/blog" | "/blog/" | `/blog/${string}` & {} | `/blog/${string}/` & {} | "/casos-de-estudo" | "/casos-de-estudo/" | `/casos-de-estudo/${string}` & {} | `/casos-de-estudo/${string}/` & {} | "/catalogo" | "/catalogo/" | "/contacto" | "/contacto/" | "/produtos" | "/produtos/" | `/produtos/${string}` & {} | `/produtos/${string}/` & {} | "/sobre-nos" | "/sobre-nos/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/.DS_Store" | "/.gitkeep" | "/favicon.svg" | "/images/blog-editorial.png" | "/images/case-installation.png" | "/images/product-materials.png" | "/images/recycled-products-hero.png" | "/logo/brand_mark.png" | string & {};
	}
}