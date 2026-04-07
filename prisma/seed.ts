import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await hash("admin123", 10);
  const managerHash = await hash("manager123", 10);
  const techHash = await hash("tech123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@oceanops.demo" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@oceanops.demo",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@oceanops.demo" },
    update: {},
    create: {
      name: "Manager User",
      email: "manager@oceanops.demo",
      passwordHash: managerHash,
      role: "MANAGER",
    },
  });

  const tech1 = await prisma.user.upsert({
    where: { email: "tech1@oceanops.demo" },
    update: {},
    create: {
      name: "Tech One",
      email: "tech1@oceanops.demo",
      passwordHash: techHash,
      role: "TECHNICIAN",
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: "tech2@oceanops.demo" },
    update: {},
    create: {
      name: "Tech Two",
      email: "tech2@oceanops.demo",
      passwordHash: techHash,
      role: "TECHNICIAN",
    },
  });

  const yacht1 = await prisma.yacht.upsert({
    where: { id: "seed-yacht-1" },
    update: {},
    create: {
      id: "seed-yacht-1",
      name: "Sea Breeze",
      registrationNumber: "REG001",
      model: "Sunseeker 75",
      year: 2020,
      ownerName: "John Owner",
      marina: "Marina One",
      maintenanceHealth: "Good",
    },
  });

  const yacht2 = await prisma.yacht.upsert({
    where: { id: "seed-yacht-2" },
    update: {},
    create: {
      id: "seed-yacht-2",
      name: "Ocean Dream",
      registrationNumber: "REG002",
      model: "Princess 62",
      year: 2021,
      ownerName: "Jane Owner",
      marina: "Marina Two",
    },
  });

  await prisma.assignment.upsert({
    where: {
      yachtId_userId: { yachtId: yacht1.id, userId: tech1.id },
    },
    update: {},
    create: { yachtId: yacht1.id, userId: tech1.id },
  });
  await prisma.assignment.upsert({
    where: {
      yachtId_userId: { yachtId: yacht2.id, userId: tech1.id },
    },
    update: {},
    create: { yachtId: yacht2.id, userId: tech1.id },
  });
  await prisma.assignment.upsert({
    where: {
      yachtId_userId: { yachtId: yacht2.id, userId: tech2.id },
    },
    update: {},
    create: { yachtId: yacht2.id, userId: tech2.id },
  });

  const wo1 = await prisma.workOrder.create({
    data: {
      yachtId: yacht1.id,
      title: "Engine service",
      description: "Annual engine check",
      priority: "HIGH",
      status: "OPEN",
      createdByUserId: manager.id,
      assignedToUserId: tech1.id,
    },
  });

  const wo2 = await prisma.workOrder.create({
    data: {
      yachtId: yacht2.id,
      title: "AC unit repair",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      createdByUserId: admin.id,
      assignedToUserId: tech2.id,
    },
  });

  const wo3 = await prisma.workOrder.create({
    data: {
      yachtId: yacht1.id,
      title: "Bilge pump replacement",
      priority: "LOW",
      status: "DONE",
      createdByUserId: manager.id,
    },
  });

  await prisma.logEntry.create({
    data: {
      yachtId: yacht1.id,
      workOrderId: wo1.id,
      authorUserId: tech1.id,
      entryType: "STATUS_UPDATE",
      text: "Started inspection",
    },
  });
  await prisma.logEntry.create({
    data: {
      yachtId: yacht2.id,
      authorUserId: manager.id,
      entryType: "NOTE",
      text: "Quarterly review scheduled",
    },
  });
  await prisma.logEntry.create({
    data: {
      yachtId: yacht1.id,
      workOrderId: wo3.id,
      authorUserId: tech1.id,
      entryType: "CHECKLIST",
      text: "Pump replaced and tested",
    },
  });

  console.log("Seed complete: admin, manager, 2 techs, 2 yachts, assignments, work orders, log entries.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
