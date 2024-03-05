<script>
	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
</script>

<div>
	<Label for="" class="block text-sm text-gray-500 dark:text-gray-300">Telefono</Label>

	<Input
		class="mt-2 block w-full placeholder-gray-400/70 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
		type="number"
		inputmode="numeric"
		placeholder="Telefono"
	/>

	<p class="mt-3 text-xs text-gray-400 dark:text-gray-600">
		Ingresa idealmente un telefono propio de tu negocio.
	</p>
</div>
