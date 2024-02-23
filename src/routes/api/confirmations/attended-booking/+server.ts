import { prisma } from '@/database/client';
import { text } from '@sveltejs/kit';

export async function POST({ request }: { request: Request }) {
	try {
		const { bookingId } = await request.json();

		// Update the booking status to mark it as attended
		const updatedBooking = await prisma.booking.update({
			where: { id: parseInt(bookingId) },
			data: { attended: true }
		});

		return {
			status: 200,
			body: updatedBooking
		};
	} catch (error) {
		return {
			status: 500,
			body: { error: 'Failed to confirm booking attendance' }
		};
	}
}

/** @type {import('./$types').RequestHandler} */
export async function fallback({ request }: { request: Request }) {
	// Additional validation: Handle unsupported methods
	return text(`Unsupported method: ${request.method}`);
}
