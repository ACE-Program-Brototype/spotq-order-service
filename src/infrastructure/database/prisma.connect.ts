import logger from "@infrastructure/logger/pino.js";
import prisma from "./prisma.js";

export const connectDatabase = async (): Promise<void> => {
	await prisma.$connect();
	logger.info("Connected to PostgreSQL Aiven");
};

export const disconnectDatabase = async (): Promise<void> => {
	await prisma.$disconnect();
	logger.info("PostgreSQL disconnected");
};
