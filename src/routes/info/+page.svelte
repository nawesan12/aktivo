<script>
	import PlanBenefits from '@/components/ui/pricing/plan-benefits.svelte';
	import PlanSelector from '@/components/ui/pricing/plan-selector.svelte';
</script>

<section class="flex lg:max-w-2xl">
	<div class="px-6 py-8 mx-auto">
		<h1
			class="text-2xl font-semibold text-center text-gray-800 capitalize lg:text-3xl dark:text-white"
		>
			Planes Aktivo
		</h1>

		<p class="max-w-2xl mx-auto mt-4 text-center text-gray-500 xl:mt-6 dark:text-gray-300">
			Lorem ipsum, dolor sit amet consectetur adipisicing elit. Alias quas magni libero consequuntur
			voluptatum velit amet id repudiandae ea, deleniti laborum in neque eveniet.
		</p>
		<PlanSelector />
		<PlanBenefits />

		<div class="flex justify-center mt-8">
			<button
				class="px-8 py-2 tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-600 rounded-md hover:bg-blue-500 focus:outline-none focus:bg-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-80"
			>
				Choose Plan
			</button>
		</div>
	</div>
</section>
