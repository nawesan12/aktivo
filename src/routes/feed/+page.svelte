<script>
	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
</script>

<main>
	<section class="p-4 mx-auto space-y-8 w-full lg:max-w-4xl">
		<h2 class="text-2xl font-semibold">Queres volver a visitar [nombre del lugar]?</h2>

		imagen del lugar y detalles
		<br />
		<a href="/[nombre del lugar]">Agendar turno</a>
	</section>

	<section class="p-4 mx-auto space-y-8 w-full lg:max-w-4xl">
		<h2 class="text-2xl font-semibold">Tus lugares</h2>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
			<div class="h-32 rounded-lg bg-gray-200"></div>
			<div class="h-32 rounded-lg bg-gray-200"></div>
		</div>
	</section>

	<section class="p-4 mx-auto space-y-8 w-full lg:max-w-4xl">
		<h2 class="text-2xl font-semibold">Otros comercios</h2>

		<section class="w-full flex items-center gap-4 lg:max-w-4xl">
			<Label for="search-commerce">
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="#000000"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
					<path d="M21 21l-6 -6" />
				</svg>
			</Label>
			<Input class="focus:border focus:border-[#09f]" id="search-commerce" placeholder="Buscar" />
		</section>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
			<div class="h-32 rounded-lg bg-gray-200"></div>
			<div class="h-32 rounded-lg bg-gray-200"></div>
		</div>
	</section>
</main>
