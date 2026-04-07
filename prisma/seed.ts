import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      id: "org_demo_default",
      name: "Demo fleet",
      slug: "demo",
    },
  });

  const adminHash = await hash("admin123", 10);
  const managerHash = await hash("manager123", 10);
  const techHash = await hash("tech123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@oceanops.demo" },
    update: { organizationId: org.id, isPlatformAdmin: false },
    create: {
      organizationId: org.id,
      name: "Admin User",
      email: "admin@oceanops.demo",
      passwordHash: adminHash,
      role: "ADMIN",
      isPlatformAdmin: false,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@oceanops.demo" },
    update: { organizationId: org.id, isPlatformAdmin: false },
    create: {
      organizationId: org.id,
      name: "Manager User",
      email: "manager@oceanops.demo",
      passwordHash: managerHash,
      role: "MANAGER",
      isPlatformAdmin: false,
    },
  });

  const tech1 = await prisma.user.upsert({
    where: { email: "tech1@oceanops.demo" },
    update: { organizationId: org.id, isPlatformAdmin: false },
    create: {
      organizationId: org.id,
      name: "Tech One",
      email: "tech1@oceanops.demo",
      passwordHash: techHash,
      role: "TECHNICIAN",
      isPlatformAdmin: false,
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: "tech2@oceanops.demo" },
    update: { organizationId: org.id, isPlatformAdmin: false },
    create: {
      organizationId: org.id,
      name: "Tech Two",
      email: "tech2@oceanops.demo",
      passwordHash: techHash,
      role: "TECHNICIAN",
      isPlatformAdmin: false,
    },
  });

  const yacht1 = await prisma.yacht.upsert({
    where: { id: "seed-yacht-1" },
    update: { organizationId: org.id },
    create: {
      id: "seed-yacht-1",
      organizationId: org.id,
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
    update: { organizationId: org.id },
    create: {
      id: "seed-yacht-2",
      organizationId: org.id,
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

  const platformHash = await hash("Navis", 10);
  await prisma.user.upsert({
    where: { email: "admin@admin" },
    update: {
      name: "Platform owner",
      passwordHash: platformHash,
      role: "ADMIN",
      isPlatformAdmin: true,
      organizationId: null,
    },
    create: {
      email: "admin@admin",
      name: "Platform owner",
      passwordHash: platformHash,
      role: "ADMIN",
      isPlatformAdmin: true,
      organizationId: null,
    },
  });

  console.log(
    "Seed complete: demo org, platform owner (admin@admin), admin, manager, 2 techs, 2 yachts, assignments, work orders, log entries."
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
