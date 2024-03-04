<script>
	import Input from '@/components/ui/input/input.svelte';
</script>

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

	<section class="w-full lg:max-w-4xl">
		<Input placeholder="Buscar" />
	</section>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
		<div class="h-32 rounded-lg bg-gray-200"></div>
		<div class="h-32 rounded-lg bg-gray-200"></div>
	</div>
</section>
