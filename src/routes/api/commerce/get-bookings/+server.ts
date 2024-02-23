// src/routes/api/getCommerceBookings.json.ts

import { prisma } from '@/database/client';
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from 'date-fns';

export async function GET({ request }: { request: Request }) {
	try {
		const { commerceId } = request.params; // Assuming commerceId is passed as a parameter in the URL

		// Get current date
		const currentDate = new Date();

		// Get bookings for the current day
		const currentDayBookings = await prisma.booking.findMany({
			where: {
				commerceId: parseInt(commerceId),
				startAt: {
					gte: startOfDay(currentDate),
					lt: endOfDay(currentDate)
				}
			},
			include: {
				client: true,
				employee: true,
				service: true
			}
		});

		// Get bookings for the next day
		const nextDay = addDays(currentDate, 1);
		const nextDayBookings = await prisma.booking.findMany({
			where: {
				commerceId: parseInt(commerceId),
				startAt: {
					gte: startOfDay(nextDay),
					lt: endOfDay(nextDay)
				}
			},
			include: {
				client: true,
				employee: true,
				service: true
			}
		});

		// Get bookings for the entire week
		const startOfWeekDate = startOfWeek(currentDate);
		const endOfWeekDate = endOfWeek(currentDate);
		const weekBookings = await prisma.booking.findMany({
			where: {
				commerceId: parseInt(commerceId),
				startAt: {
					gte: startOfWeekDate,
					lt: endOfWeekDate
				}
			},
			include: {
				client: true,
				employee: true,
				service: true
			}
		});

		return {
			status: 200,
			body: {
				currentDayBookings,
				nextDayBookings,
				weekBookings
			}
		};
	} catch (error) {
		return {
			status: 500,
			body: { error: 'Failed to fetch commerce bookings' }
		};
	}
}
