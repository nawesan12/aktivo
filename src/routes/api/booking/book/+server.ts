// src/routes/api/bookBooking.json.ts

import { prisma } from '@/database/client';
import { text } from '@sveltejs/kit';

export async function POST({ request }: { request: Request }) {
	try {
		const { commerceId, userId, employeeId, serviceId, startAt, endAt } = await request.json();

		// Save booking to the database
		const newBooking = await prisma.booking.create({
			data: {
				commerceId,
				userId,
				employeeId,
				serviceId,
				startAt,
				endAt
			}
		});

		return {
			status: 200,
			body: newBooking
		};
	} catch (error) {
		return {
			status: 500,
			body: { error: 'Failed to book a booking' }
		};
	}
}

/** @type {import('./$types').RequestHandler} */
export async function fallback({ request }: { request: Request }) {
	// Additional validation: Handle unsupported methods
	return text(`Unsupported method: ${request.method}`);
}
