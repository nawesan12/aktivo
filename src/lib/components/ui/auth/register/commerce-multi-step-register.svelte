<script>
	import { goto } from '$app/navigation';
	import Button from '../../button/button.svelte';
	import AddServiceForm from './multi-step/add-service-form.svelte';
	import CommerceBasicInfo from './multi-step/commerce-basic-info.svelte';
	import CommerceEmail from './multi-step/commerce-email.svelte';
	import OwnerDetails from './multi-step/owner-details.svelte';
	import ProfileImageCommerce from './multi-step/profile-image-commerce.svelte';
	import TeamFiller from './multi-step/team-filler.svelte';
	import PhoneInput from './multi-step/phone-input.svelte';
	import LocationSelector from './multi-step/location-selector.svelte';

	let currentStep = 0;

	function handleSteps() {
		if (currentStep === 8) {
			// Ver donde manejar la subida a la db
			// y guardar token de sesion en localstorage
			// cargar data del commerce en localstorage
			goto('/dashboard');
			return;
		}

		currentStep++;
	}
</script>

<main class="flex min-h-screen flex-col items-center justify-center">
	<section class="w-full lg:max-w-lg flex flex-col gap-8 p-6">
		{#if currentStep === 0}
			<CommerceBasicInfo />
		{:else if currentStep === 1}
			<CommerceEmail />
		{:else if currentStep === 2}
			<ProfileImageCommerce />
		{:else if currentStep === 3}
			<OwnerDetails />
		{:else if currentStep === 4}
			<PhoneInput />
		{:else if currentStep === 5}
			<LocationSelector />
		{:else if currentStep === 6}
			<AddServiceForm />
		{:else if currentStep === 7}
			<TeamFiller />
		{:else if currentStep === 8}
			Codigo de ultimar detalles? / Bienvenida
		{/if}
		<section class="w-full max-w-sm text-left">
			<Button on:click={handleSteps}>Siguiente</Button>
		</section>
	</section>
</main>
