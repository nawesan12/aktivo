// src/routes/api/getCommercePaymentHistory.json.ts

import { prisma } from '@/database/client';

export async function get(request: Request) {
	try {
		const { commerceId } = request.params; // Assuming commerceId is passed as a parameter in the URL

		// Fetch payment history for the commerce
		const paymentHistory = await prisma.payment.findMany({
			where: { commerceId: parseInt(commerceId) }
			// You can include additional conditions or sorting options here if needed
		});

		return {
			status: 200,
			body: paymentHistory
		};
	} catch (error) {
		return {
			status: 500,
			body: { error: 'Failed to fetch payment history of the commerce' }
		};
	}
}
