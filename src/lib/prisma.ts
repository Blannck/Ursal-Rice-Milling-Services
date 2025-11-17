import { PrismaClient } from "@prisma/client";


const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };


export const prisma =
globalForPrisma.prisma ??
new PrismaClient({
log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
transactionOptions: {
maxWait: 15000, // Maximum time to wait to start a transaction (15s)
timeout: 30000, // Maximum time a transaction can run (30s)
},
});


if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;