<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Input from '@/components/ui/input/input.svelte';
	import Label from '@/components/ui/label/label.svelte';
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Registro</Card.Title>
		<Card.Description>Ahora vamos a registrarte como dueño de tu negocio.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form class="flex flex-col gap-4">
			<div class="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-4">
				<div class="">
					<Label>Nombre</Label>
					<Input type="text" placeholder="Nombre" />
				</div>
				<div class="">
					<Label>Apellido</Label>
					<Input type="text" placeholder="Apellido" />
				</div>
			</div>

			<div>
				<Label>Email</Label>
				<Input type="email" placeholder="tu@email.com" />
			</div>

			<div>
				<Label>Telefono</Label>
				<Input type="tel" inputmode="numeric" placeholder="Telefono" />
			</div>

			<div>
				<Label>Contraseña</Label>
				<Input type="password" placeholder="Contraseña" />
			</div>
		</form>
	</Card.Content>
</Card.Root>
