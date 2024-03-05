<script>
	import * as Card from '$lib/components/ui/card';
	import { onMount } from 'svelte';

	let city = '';

	function getLocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(async (position) => {
				const { latitude, longitude } = position.coords;

				// Call reverse geocoding API to get city name from coordinates
				const response = await fetch(
					`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&appid=YOUR_OPENWEATHERMAP_API_KEY`
				);
				const data = await response.json();

				// Extract city name from the response
				city = data[0].name;
			});
		} else {
			alert('No se pudo obtener tu ubicacion, ingresala manualmente, por favor.');
		}
	}

	onMount(() => {
		getLocation();
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Ubicacion</Card.Title>
		<Card.Description>Indicanos en que ciudad esta ubicado tu negocio.</Card.Description>
	</Card.Header>
	<Card.Content>
		<p>Si permitis la deteccion de ubicacion la ciudad sera rellenada automaticamente!</p>
	</Card.Content>
	<Card.Footer>
		<select name="" id="">
			<option value="">Mar del Plata</option>
		</select>
	</Card.Footer>
</Card.Root>
