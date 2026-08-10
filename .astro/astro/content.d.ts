declare module 'astro:content' {
	interface RenderResult {
		Content: import('astro/runtime/server/index.js').AstroComponentFactory;
		headings: import('astro').MarkdownHeading[];
		remarkPluginFrontmatter: Record<string, any>;
	}
	interface Render {
		'.md': Promise<RenderResult>;
	}

	export interface RenderedContent {
		html: string;
		metadata?: {
			imagePaths: Array<string>;
			[key: string]: unknown;
		};
	}
}

declare module 'astro:content' {
	type Flatten<T> = T extends { [K: string]: infer U } ? U : never;

	export type CollectionKey = keyof AnyEntryMap;
	export type CollectionEntry<C extends CollectionKey> = Flatten<AnyEntryMap[C]>;

	export type ContentCollectionKey = keyof ContentEntryMap;
	export type DataCollectionKey = keyof DataEntryMap;

	type AllValuesOf<T> = T extends any ? T[keyof T] : never;
	type ValidContentEntrySlug<C extends keyof ContentEntryMap> = AllValuesOf<
		ContentEntryMap[C]
	>['slug'];

	/** @deprecated Use `getEntry` instead. */
	export function getEntryBySlug<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		// Note that this has to accept a regular string too, for SSR
		entrySlug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;

	/** @deprecated Use `getEntry` instead. */
	export function getDataEntryById<C extends keyof DataEntryMap, E extends keyof DataEntryMap[C]>(
		collection: C,
		entryId: E,
	): Promise<CollectionEntry<C>>;

	export function getCollection<C extends keyof AnyEntryMap, E extends CollectionEntry<C>>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => entry is E,
	): Promise<E[]>;
	export function getCollection<C extends keyof AnyEntryMap>(
		collection: C,
		filter?: (entry: CollectionEntry<C>) => unknown,
	): Promise<CollectionEntry<C>[]>;

	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(entry: {
		collection: C;
		slug: E;
	}): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(entry: {
		collection: C;
		id: E;
	}): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof ContentEntryMap,
		E extends ValidContentEntrySlug<C> | (string & {}),
	>(
		collection: C,
		slug: E,
	): E extends ValidContentEntrySlug<C>
		? Promise<CollectionEntry<C>>
		: Promise<CollectionEntry<C> | undefined>;
	export function getEntry<
		C extends keyof DataEntryMap,
		E extends keyof DataEntryMap[C] | (string & {}),
	>(
		collection: C,
		id: E,
	): E extends keyof DataEntryMap[C]
		? Promise<DataEntryMap[C][E]>
		: Promise<CollectionEntry<C> | undefined>;

	/** Resolve an array of entry references from the same collection */
	export function getEntries<C extends keyof ContentEntryMap>(
		entries: {
			collection: C;
			slug: ValidContentEntrySlug<C>;
		}[],
	): Promise<CollectionEntry<C>[]>;
	export function getEntries<C extends keyof DataEntryMap>(
		entries: {
			collection: C;
			id: keyof DataEntryMap[C];
		}[],
	): Promise<CollectionEntry<C>[]>;

	export function render<C extends keyof AnyEntryMap>(
		entry: AnyEntryMap[C][string],
	): Promise<RenderResult>;

	export function reference<C extends keyof AnyEntryMap>(
		collection: C,
	): import('astro/zod').ZodEffects<
		import('astro/zod').ZodString,
		C extends keyof ContentEntryMap
			? {
					collection: C;
					slug: ValidContentEntrySlug<C>;
				}
			: {
					collection: C;
					id: keyof DataEntryMap[C];
				}
	>;
	// Allow generic `string` to avoid excessive type errors in the config
	// if `dev` is not running to update as you edit.
	// Invalid collection names will be caught at build time.
	export function reference<C extends string>(
		collection: C,
	): import('astro/zod').ZodEffects<import('astro/zod').ZodString, never>;

	type ReturnTypeOrOriginal<T> = T extends (...args: any[]) => infer R ? R : T;
	type InferEntrySchema<C extends keyof AnyEntryMap> = import('astro/zod').infer<
		ReturnTypeOrOriginal<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type ContentEntryMap = {
		"posts": {
"general/getting-started.md": {
	id: "general/getting-started.md";
  slug: "general/getting-started";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"general/welcome.md": {
	id: "general/welcome.md";
  slug: "general/welcome";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"reading-notes/effective-engineer.md": {
	id: "reading-notes/effective-engineer.md";
  slug: "reading-notes/effective-engineer";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"reading-notes/erta-fooled-by-randomness.md": {
	id: "reading-notes/erta-fooled-by-randomness.md";
  slug: "reading-notes/erta-fooled-by-randomness";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"reading-notes/taleb-antifragile.md": {
	id: "reading-notes/taleb-antifragile.md";
  slug: "reading-notes/taleb-antifragile";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"reading-notes/taleb-the-black-swan.md": {
	id: "reading-notes/taleb-the-black-swan.md";
  slug: "reading-notes/taleb-the-black-swan";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/agent-engineering-new-discipline.md": {
	id: "tech-learning/agent-engineering-new-discipline.md";
  slug: "tech-learning/agent-engineering-new-discipline";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/anthropic-mcp-code-execution-analysis.md": {
	id: "tech-learning/anthropic-mcp-code-execution-analysis.md";
  slug: "tech-learning/anthropic-mcp-code-execution-analysis";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/chrome-devtools-mcp-guide.md": {
	id: "tech-learning/chrome-devtools-mcp-guide.md";
  slug: "tech-learning/chrome-devtools-mcp-guide";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/claude-skills-guide.md": {
	id: "tech-learning/claude-skills-guide.md";
  slug: "tech-learning/claude-skills-guide";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/deepseek-v3-technical-analysis.md": {
	id: "tech-learning/deepseek-v3-technical-analysis.md";
  slug: "tech-learning/deepseek-v3-technical-analysis";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/git-workflow.md": {
	id: "tech-learning/git-workflow.md";
  slug: "tech-learning/git-workflow";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/mcp-2026-07-28-minus-revolution.md": {
	id: "tech-learning/mcp-2026-07-28-minus-revolution.md";
  slug: "tech-learning/mcp-2026-07-28-minus-revolution";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/shell-basics-guide.md": {
	id: "tech-learning/shell-basics-guide.md";
  slug: "tech-learning/shell-basics-guide";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/strands-agents-sdk-guide.md": {
	id: "tech-learning/strands-agents-sdk-guide.md";
  slug: "tech-learning/strands-agents-sdk-guide";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"tech-learning/zoom-ai-humanitys-last-exam-analysis.md": {
	id: "tech-learning/zoom-ai-humanitys-last-exam-analysis.md";
  slug: "tech-learning/zoom-ai-humanitys-last-exam-analysis";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/01_1966_Alan_Perlis.md": {
	id: "turing-award/01_1966_Alan_Perlis.md";
  slug: "turing-award/01_1966_alan_perlis";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/02_1967_Maurice_Wilkes.md": {
	id: "turing-award/02_1967_Maurice_Wilkes.md";
  slug: "turing-award/02_1967_maurice_wilkes";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/03_1968_Richard_Hamming.md": {
	id: "turing-award/03_1968_Richard_Hamming.md";
  slug: "turing-award/03_1968_richard_hamming";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/04_1969_Marvin_Minsky.md": {
	id: "turing-award/04_1969_Marvin_Minsky.md";
  slug: "turing-award/04_1969_marvin_minsky";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/05_1970_James_H_Wilkinson.md": {
	id: "turing-award/05_1970_James_H_Wilkinson.md";
  slug: "turing-award/05_1970_james_h_wilkinson";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/06_1971_John_McCarthy.md": {
	id: "turing-award/06_1971_John_McCarthy.md";
  slug: "turing-award/06_1971_john_mccarthy";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/07_1972_Edsger_W_Dijkstra.md": {
	id: "turing-award/07_1972_Edsger_W_Dijkstra.md";
  slug: "turing-award/07_1972_edsger_w_dijkstra";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/08_1973_Charles_W_Bachman.md": {
	id: "turing-award/08_1973_Charles_W_Bachman.md";
  slug: "turing-award/08_1973_charles_w_bachman";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/09_1974_Donald_E_Knuth.md": {
	id: "turing-award/09_1974_Donald_E_Knuth.md";
  slug: "turing-award/09_1974_donald_e_knuth";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/10_1975_Allen_Newell_and_Herbert_A_Simon.md": {
	id: "turing-award/10_1975_Allen_Newell_and_Herbert_A_Simon.md";
  slug: "turing-award/10_1975_allen_newell_and_herbert_a_simon";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/11_1976_Michael_O_Rabin_and_Dana_S_Scott.md": {
	id: "turing-award/11_1976_Michael_O_Rabin_and_Dana_S_Scott.md";
  slug: "turing-award/11_1976_michael_o_rabin_and_dana_s_scott";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/12_1977_John_Backus.md": {
	id: "turing-award/12_1977_John_Backus.md";
  slug: "turing-award/12_1977_john_backus";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/13_1978_Robert_W_Floyd.md": {
	id: "turing-award/13_1978_Robert_W_Floyd.md";
  slug: "turing-award/13_1978_robert_w_floyd";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/14_1979_Kenneth_E_Iverson.md": {
	id: "turing-award/14_1979_Kenneth_E_Iverson.md";
  slug: "turing-award/14_1979_kenneth_e_iverson";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/15_1980_C_A_R_Hoare.md": {
	id: "turing-award/15_1980_C_A_R_Hoare.md";
  slug: "turing-award/15_1980_c_a_r_hoare";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/16_1981_Edgar_F_Codd.md": {
	id: "turing-award/16_1981_Edgar_F_Codd.md";
  slug: "turing-award/16_1981_edgar_f_codd";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/17_1982_Stephen_A_Cook.md": {
	id: "turing-award/17_1982_Stephen_A_Cook.md";
  slug: "turing-award/17_1982_stephen_a_cook";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/18_1983_Ken_Thompson_and_Dennis_Ritchie.md": {
	id: "turing-award/18_1983_Ken_Thompson_and_Dennis_Ritchie.md";
  slug: "turing-award/18_1983_ken_thompson_and_dennis_ritchie";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/19_1984_Niklaus_Wirth.md": {
	id: "turing-award/19_1984_Niklaus_Wirth.md";
  slug: "turing-award/19_1984_niklaus_wirth";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/20_1985_Richard_M_Karp.md": {
	id: "turing-award/20_1985_Richard_M_Karp.md";
  slug: "turing-award/20_1985_richard_m_karp";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/21_1986_John_E_Hopcroft_and_Robert_E_Tarjan.md": {
	id: "turing-award/21_1986_John_E_Hopcroft_and_Robert_E_Tarjan.md";
  slug: "turing-award/21_1986_john_e_hopcroft_and_robert_e_tarjan";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/22_1987_John_Cocke.md": {
	id: "turing-award/22_1987_John_Cocke.md";
  slug: "turing-award/22_1987_john_cocke";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/23_1988_Ivan_Sutherland.md": {
	id: "turing-award/23_1988_Ivan_Sutherland.md";
  slug: "turing-award/23_1988_ivan_sutherland";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/24_1989_William_Kahan.md": {
	id: "turing-award/24_1989_William_Kahan.md";
  slug: "turing-award/24_1989_william_kahan";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/25_1990_Fernando_J_Corbató.md": {
	id: "turing-award/25_1990_Fernando_J_Corbató.md";
  slug: "turing-award/25_1990_fernando_j_corbató";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/26_1991_Robin_Milner.md": {
	id: "turing-award/26_1991_Robin_Milner.md";
  slug: "turing-award/26_1991_robin_milner";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/27_1992_Butler_W_Lampson.md": {
	id: "turing-award/27_1992_Butler_W_Lampson.md";
  slug: "turing-award/27_1992_butler_w_lampson";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/28_1993_Juris_Hartmanis_and_Richard_E_Stearns.md": {
	id: "turing-award/28_1993_Juris_Hartmanis_and_Richard_E_Stearns.md";
  slug: "turing-award/28_1993_juris_hartmanis_and_richard_e_stearns";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/29_1994_Edward_A_Feigenbaum_and_Raj_Reddy.md": {
	id: "turing-award/29_1994_Edward_A_Feigenbaum_and_Raj_Reddy.md";
  slug: "turing-award/29_1994_edward_a_feigenbaum_and_raj_reddy";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/30_1995_Manuel_Blum.md": {
	id: "turing-award/30_1995_Manuel_Blum.md";
  slug: "turing-award/30_1995_manuel_blum";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/31_1996_Amir_Pnueli.md": {
	id: "turing-award/31_1996_Amir_Pnueli.md";
  slug: "turing-award/31_1996_amir_pnueli";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/32_1997_Douglas_C_Engelbart.md": {
	id: "turing-award/32_1997_Douglas_C_Engelbart.md";
  slug: "turing-award/32_1997_douglas_c_engelbart";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/33_1998_Jim_Gray.md": {
	id: "turing-award/33_1998_Jim_Gray.md";
  slug: "turing-award/33_1998_jim_gray";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/34_1999_Frederick_P_Brooks_Jr.md": {
	id: "turing-award/34_1999_Frederick_P_Brooks_Jr.md";
  slug: "turing-award/34_1999_frederick_p_brooks_jr";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/35_2000_Andrew_Yao.md": {
	id: "turing-award/35_2000_Andrew_Yao.md";
  slug: "turing-award/35_2000_andrew_yao";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/36_2001_Ole_Johan_Dahl_and_Kristen_Nygaard.md": {
	id: "turing-award/36_2001_Ole_Johan_Dahl_and_Kristen_Nygaard.md";
  slug: "turing-award/36_2001_ole_johan_dahl_and_kristen_nygaard";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/37_2002_Rivest_Shamir_and_Adleman.md": {
	id: "turing-award/37_2002_Rivest_Shamir_and_Adleman.md";
  slug: "turing-award/37_2002_rivest_shamir_and_adleman";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/38_2003_Alan_Kay.md": {
	id: "turing-award/38_2003_Alan_Kay.md";
  slug: "turing-award/38_2003_alan_kay";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/39_2004_Vint_Cerf_and_Bob_Kahn.md": {
	id: "turing-award/39_2004_Vint_Cerf_and_Bob_Kahn.md";
  slug: "turing-award/39_2004_vint_cerf_and_bob_kahn";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/40_2005_Peter_Naur.md": {
	id: "turing-award/40_2005_Peter_Naur.md";
  slug: "turing-award/40_2005_peter_naur";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/41_2006_Frances_E_Allen.md": {
	id: "turing-award/41_2006_Frances_E_Allen.md";
  slug: "turing-award/41_2006_frances_e_allen";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/42_2007_Clarke_Emerson_Sifakis.md": {
	id: "turing-award/42_2007_Clarke_Emerson_Sifakis.md";
  slug: "turing-award/42_2007_clarke_emerson_sifakis";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/43_2008_Barbara_Liskov.md": {
	id: "turing-award/43_2008_Barbara_Liskov.md";
  slug: "turing-award/43_2008_barbara_liskov";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/44_2009_Charles_P_Thacker.md": {
	id: "turing-award/44_2009_Charles_P_Thacker.md";
  slug: "turing-award/44_2009_charles_p_thacker";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/45_2010_Leslie_G_Valiant.md": {
	id: "turing-award/45_2010_Leslie_G_Valiant.md";
  slug: "turing-award/45_2010_leslie_g_valiant";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/46_2011_Judea_Pearl.md": {
	id: "turing-award/46_2011_Judea_Pearl.md";
  slug: "turing-award/46_2011_judea_pearl";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/47_2012_Shafi_Goldwasser_and_Silvio_Micali.md": {
	id: "turing-award/47_2012_Shafi_Goldwasser_and_Silvio_Micali.md";
  slug: "turing-award/47_2012_shafi_goldwasser_and_silvio_micali";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/48_2013_Leslie_Lamport.md": {
	id: "turing-award/48_2013_Leslie_Lamport.md";
  slug: "turing-award/48_2013_leslie_lamport";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/49_2014_Michael_Stonebraker.md": {
	id: "turing-award/49_2014_Michael_Stonebraker.md";
  slug: "turing-award/49_2014_michael_stonebraker";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/50_2015_Whitfield_Diffie_and_Martin_E_Hellman.md": {
	id: "turing-award/50_2015_Whitfield_Diffie_and_Martin_E_Hellman.md";
  slug: "turing-award/50_2015_whitfield_diffie_and_martin_e_hellman";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/51_2016_Tim_Berners_Lee.md": {
	id: "turing-award/51_2016_Tim_Berners_Lee.md";
  slug: "turing-award/51_2016_tim_berners_lee";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/52_2017_John_L_Hennessy_and_David_A_Patterson.md": {
	id: "turing-award/52_2017_John_L_Hennessy_and_David_A_Patterson.md";
  slug: "turing-award/52_2017_john_l_hennessy_and_david_a_patterson";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/53_2018_LeCun_Hinton_Bengio.md": {
	id: "turing-award/53_2018_LeCun_Hinton_Bengio.md";
  slug: "turing-award/53_2018_lecun_hinton_bengio";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/54_2019_Ed_Catmull_and_Pat_Hanrahan.md": {
	id: "turing-award/54_2019_Ed_Catmull_and_Pat_Hanrahan.md";
  slug: "turing-award/54_2019_ed_catmull_and_pat_hanrahan";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/55_2020_Alfred_V_Aho_and_Jeffrey_D_Ullman.md": {
	id: "turing-award/55_2020_Alfred_V_Aho_and_Jeffrey_D_Ullman.md";
  slug: "turing-award/55_2020_alfred_v_aho_and_jeffrey_d_ullman";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/56_2021_Jack_J_Dongarra.md": {
	id: "turing-award/56_2021_Jack_J_Dongarra.md";
  slug: "turing-award/56_2021_jack_j_dongarra";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/57_2022_Robert_M_Metcalfe.md": {
	id: "turing-award/57_2022_Robert_M_Metcalfe.md";
  slug: "turing-award/57_2022_robert_m_metcalfe";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/58_2023_Avi_Wigderson.md": {
	id: "turing-award/58_2023_Avi_Wigderson.md";
  slug: "turing-award/58_2023_avi_wigderson";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
"turing-award/alan-turing.md": {
	id: "turing-award/alan-turing.md";
  slug: "turing-award/alan-turing";
  body: string;
  collection: "posts";
  data: InferEntrySchema<"posts">
} & { render(): Render[".md"] };
};

	};

	type DataEntryMap = {
		
	};

	type AnyEntryMap = ContentEntryMap & DataEntryMap;

	export type ContentConfig = typeof import("../../src/content/config.js");
}
