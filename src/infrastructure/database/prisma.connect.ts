import logger from "@infrastructure/observability/logger.ts";
import prisma from "./prisma.ts";

export const connectDatabase = async (): Promise<void> => {
	await prisma.$connect();
	logger.info("Connected to PostgreSQL Aiven");
};

export const disconnectDatabase = async (): Promise<void> => {
	await prisma.$disconnect();
	logger.info("PostgreSQL disconnected");
};
