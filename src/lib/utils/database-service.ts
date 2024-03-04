import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AvailableTimes {
	date: Date;
	times: string[];
}

export const generateAvailableTimesAndDateFromDB = async (
	date: Date,
	vacationDays: Date[],
	initHour: string,
	finishHour: string
): Promise<AvailableTimes> => {
	const available: AvailableTimes = {
		date: date,
		times: []
	};

	const bookings = await prisma.booking.findMany({
		where: {
			date: date
		}
	});

	for (let i = 11; i < 20; i++) {
		const time = `${i}:00`;
		const isBooked = bookings.find(
			(booking) => booking.time === time && booking.status !== 'Cancelado'
		);

		if (!isBooked) {
			available.times.push(time);
		}
	}

	if (vacationDays.includes(available.date) && available.times.length) {
		const initPoint = available.times.indexOf(initHour);
		const finishPoint = available.times.indexOf(finishHour);
		if (initPoint === -1 || finishPoint === -1) return { ...available, times: [] };
		return {
			...available,
			times: available.times.slice(initPoint, finishHour ? finishPoint : available.times.length)
		};
	}

	return available;
};
