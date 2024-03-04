<script>
	import Input from '@/components/ui/input/input.svelte';
	import Textarea from '@/components/ui/textarea/textarea.svelte';
</script>

<div>
	<label for="" class="block text-sm text-gray-500 dark:text-gray-300">Nombre</label>

	<Input
		type="text"
		placeholder="Mi comercio"
		class="block mt-2 w-full placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
	/>
</div>
<div>
	<label for="" class="block text-sm text-gray-500 dark:text-gray-300">Descripcion</label>

	<Textarea
		placeholder="Descripcion de tu servicio"
		class="block mt-2 w-full placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
	/>
</div>
