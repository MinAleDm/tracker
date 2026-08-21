// Keep the shared database package side-effect free. Runtime applications own
// their PrismaClient lifecycle and import the generated client through here.
export * from "@prisma/client";
