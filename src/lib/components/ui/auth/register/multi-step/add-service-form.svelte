<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import * as Table from '$lib/components/ui/table';

	const invoices = [
		{
			nombre: 'Corte con maquina',
			duracion: '1 hora',
			precio: '$250.00'
		},
		{
			nombre: 'Perfilado',
			duracion: '10 minutos',
			precio: '$100.00'
		}
	];
</script>

<h2 class="text-3xl font-semibold m-0 p-0 h-4">Tus servicios</h2>
<p class="text-xs tracking-wide text-gray-500 dark:text-gray-400">
	Agrega todos los servicios que ofrece tu negocio.
</p>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="">Nombre</Table.Head>
			<Table.Head>Duracion</Table.Head>
			<Table.Head>Precio</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each invoices as invoice, i (i)}
			<Table.Row>
				<Table.Cell class="font-medium">{invoice.nombre}</Table.Cell>
				<Table.Cell>{invoice.duracion}</Table.Cell>
				<Table.Cell>{invoice.precio}</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>

<Dialog.Root>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Agregar servicio</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Agregar servicio</Dialog.Title>
			<Dialog.Description>Especificanos: Nombre, duracion, y precio.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="name" class="text-right">Nombre</Label>
				<Input id="name" placeholder="Nombre del servicio" class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="price" class="text-right">Precio</Label>
				<Input id="price" placeholder="Precio del servicio" class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="username" class="text-right">Duracion</Label>
				<select class="col-span-3 p-2 border rounded-lg" name="" id="">
					<option value="">15 min.</option>
					<option value="">30 min.</option>
					<option value="">45 min.</option>
					<option value="">1 hora</option>
					<option value="">1 hora y cuarto</option>
					<option value="">1 hora y media</option>
				</select>
			</div>
		</div>
		<Dialog.Footer>
			<Button type="submit">Agregar</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
