<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import * as Table from '$lib/components/ui/table';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';

	let services = ['Corte con Maquina', 'Perfilado'];

	const invoices = [
		{
			name: 'Tomas Gorosito',
			position: 'Barbero',
			services: ['Corte con Maquina', 'Perfilado']
		},
		{
			name: 'Nawe',
			position: 'Programador',
			services: ['Desarrollar']
		}
	];
</script>

<h2 class="text-3xl font-semibold m-0 p-0 h-4">El Equipo</h2>
<p class="text-xs tracking-wide text-gray-500 dark:text-gray-400">
	Agrega a todas las personas que conformen tu negocio y vayan a estar involucradas en tu
	administracion de turnos junto con su servicio correspondiente.
</p>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Nombre</Table.Head>
			<Table.Head>Posicion</Table.Head>
			<Table.Head>Servicios</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each invoices as invoice, i (i)}
			<Table.Row>
				<Table.Cell class="font-medium">{invoice.name}</Table.Cell>
				<Table.Cell>{invoice.position}</Table.Cell>
				<Table.Cell>{invoice.services.join(', ')}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<Dialog.Root>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Agregar integrante</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Agregar integrante</Dialog.Title>
			<Dialog.Description>Especificanos: Nombre, puesto, y servicios.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="name" class="text-right">Nombre</Label>
				<Input id="name" placeholder="Nombre del integrante" class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="price" class="text-right">Puesto</Label>
				<Input id="price" placeholder="Puesto del integrante" class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="price" class="text-right">Servicios</Label>
				<ul class="space-y-4">
					{#each services as service, i (i)}
						<li class="flex items-center gap-4">
							<Checkbox />

							<Label for="" class="min-w-max">{service}</Label>
						</li>
					{/each}
				</ul>
			</div>
		</div>
		<Dialog.Footer>
			<Button type="submit">Agregar</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
