import { prisma } from '@/database/client.js';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	// logica para obtener comercios mas populares y variados

	return {
		places: []
	};
}
