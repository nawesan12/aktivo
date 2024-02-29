<script>
	import Button from '../../button/button.svelte';
	import ProfileImageCommerce from './multi-step/profile-image-commerce.svelte';

	let currentStep = 0;

	function handleSteps() {
		currentStep++;
	}
</script>

<main class="flex min-h-screen flex-col items-center justify-center">
	<section class="w-full max-w-md flex flex-col gap-8">
		{#if currentStep === 0}
			<div>
				<label for="username" class="block text-sm text-gray-500 dark:text-gray-300">Username</label
				>

				<input
					type="text"
					placeholder="John Doe"
					class="block mt-2 w-full placeholder-gray-400/70 dark:placeholder-gray-500 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
				/>
			</div>
		{:else if currentStep === 1}
			<div>
				<label for="email" class="block text-sm text-gray-500 dark:text-gray-300"
					>Email Address</label
				>

				<input
					type="email"
					placeholder="john@example.com"
					class="mt-2 block w-full placeholder-gray-400/70 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-gray-700 focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-blue-300"
				/>

				<p class="mt-3 text-xs text-gray-400 dark:text-gray-600">
					Lorem ipsum dolor sit amet consectetur adipisicing elit.
				</p>
			</div>
		{:else if currentStep === 2}
			<ProfileImageCommerce />
		{/if}
		<section class="w-full max-w-sm text-left">
			<Button on:click={handleSteps}>Siguiente</Button>
		</section>
	</section>
</main>
