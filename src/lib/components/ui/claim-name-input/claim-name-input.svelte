<script lang="ts">
	import { Input } from '../input';

	let nameToBeClaimed: string = '';

	function handleNameClaiming(): void {
		if (nameToBeClaimed) alert(nameToBeClaimed);
	}
</script>

<section
	class="claim-name-input flex items-center max-w-md w-full mx-auto px-4 p-2 border rounded-lg text-lg bg-white"
>
	<span class="font-semibold">aktivo.ar/</span>
	<Input
		placeholder="Tu marca"
		bind:value={nameToBeClaimed}
		class="border-t-0 border-l-0 border-r-0 border-b border-b-slate-400 rounded-none text-lg"
	/>

	<button
		class="claim ml-4 text-white hover:bg-slate-800 transition duration-200 bg-black p-2 px-8 rounded-md font-semibold"
		on:click={handleNameClaiming}
	>
		Claim
	</button>
</section>
