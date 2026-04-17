import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where: { email: "alex@forma.studio" },
    update: {},
    create: {
      email: "alex@forma.studio",
      name: "Alex Rivera",
      password,
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
    },
  });

  // Clients
  const clientNova = await prisma.client.create({
    data: {
      name: "Nova Labs",
      email: "hello@novalabs.io",
      company: "Nova Labs Inc.",
      color: "#7c3aed",
      status: "ACTIVE",
      userId: user.id,
      avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Nova",
    },
  });

  const clientPeach = await prisma.client.create({
    data: {
      name: "Peach & Co",
      email: "studio@peachandco.com",
      company: "Peach & Co Interiors",
      color: "#f59e0b",
      status: "ACTIVE",
      userId: user.id,
      avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Peach",
    },
  });

  const clientMeridian = await prisma.client.create({
    data: {
      name: "Meridian Finance",
      email: "brand@meridianfin.com",
      company: "Meridian Financial Group",
      color: "#10b981",
      status: "ACTIVE",
      userId: user.id,
      avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Meridian",
    },
  });

  // Nova Labs Projects
  const projectNovaBrand = await prisma.project.create({
    data: {
      name: "Full Brand Identity",
      description: "Complete visual identity system including logo, typography, color palette, and brand guidelines.",
      status: "IN_PROGRESS",
      color: "#7c3aed",
      dueDate: new Date("2024-09-15"),
      budget: 8500,
      clientId: clientNova.id,
    },
  });

  const projectNovaWeb = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Landing page and marketing site for product launch.",
      status: "DISCOVERY",
      color: "#3b82f6",
      dueDate: new Date("2024-10-30"),
      budget: 5000,
      clientId: clientNova.id,
    },
  });

  // Peach & Co Projects
  const projectPeachBrand = await prisma.project.create({
    data: {
      name: "Brand Refresh",
      description: "Modernize existing brand while retaining recognizable warmth.",
      status: "REVIEW",
      color: "#f59e0b",
      dueDate: new Date("2024-08-20"),
      budget: 4200,
      clientId: clientPeach.id,
    },
  });

  // Meridian Projects
  const projectMeridianId = await prisma.project.create({
    data: {
      name: "Corporate Identity",
      description: "Professional identity system for financial advisory firm.",
      status: "DELIVERED",
      color: "#10b981",
      dueDate: new Date("2024-07-01"),
      budget: 12000,
      clientId: clientMeridian.id,
    },
  });

  // Deliverables for Nova Brand Identity
  const dLogo = await prisma.deliverable.create({
    data: {
      name: "Primary Logo",
      description: "Main wordmark and icon variants",
      type: "LOGO",
      status: "IN_REVIEW",
      sortOrder: 0,
      projectId: projectNovaBrand.id,
      dueDate: new Date("2024-08-10"),
    },
  });

  const dBrandGuide = await prisma.deliverable.create({
    data: {
      name: "Brand Guidelines",
      description: "Full brand book with usage rules",
      type: "BRAND_IDENTITY",
      status: "IN_PROGRESS",
      sortOrder: 1,
      projectId: projectNovaBrand.id,
      dueDate: new Date("2024-09-01"),
    },
  });

  const dBusinessCard = await prisma.deliverable.create({
    data: {
      name: "Business Cards",
      description: "Front and back design, multiple variants",
      type: "BUSINESS_CARD",
      status: "PENDING",
      sortOrder: 2,
      projectId: projectNovaBrand.id,
    },
  });

  const dSocial = await prisma.deliverable.create({
    data: {
      name: "Social Media Kit",
      description: "Profile images, banners, post templates",
      type: "SOCIAL_MEDIA",
      status: "PENDING",
      sortOrder: 3,
      projectId: projectNovaBrand.id,
    },
  });

  // Versions for Primary Logo
  const logoV1 = await prisma.version.create({
    data: {
      number: 1,
      notes: "Initial concept exploration — three directions presented.",
      status: "APPROVED",
      deliverableId: dLogo.id,
    },
  });

  const logoV2 = await prisma.version.create({
    data: {
      number: 2,
      notes: "Refined direction B based on client feedback. Adjusted weight and spacing.",
      status: "APPROVED",
      deliverableId: dLogo.id,
    },
  });

  const logoV3 = await prisma.version.create({
    data: {
      number: 3,
      notes: "Final adjustments — color variants, monochrome, and reversed versions.",
      status: "SENT",
      deliverableId: dLogo.id,
    },
  });

  // Assets (using Unsplash placeholder images for demo)
  await prisma.asset.createMany({
    data: [
      {
        name: "logo-v1-concept-a.png",
        url: "https://images.unsplash.com/photo-1634942537034-2531766767d1?w=800&h=600&fit=crop",
        mimeType: "image/png",
        size: 204800,
        width: 800,
        height: 600,
        versionId: logoV1.id,
      },
      {
        name: "logo-v1-concept-b.png",
        url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop",
        mimeType: "image/png",
        size: 189440,
        width: 800,
        height: 600,
        versionId: logoV1.id,
      },
      {
        name: "logo-v2-refined.png",
        url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop",
        mimeType: "image/png",
        size: 245760,
        width: 800,
        height: 600,
        versionId: logoV2.id,
      },
      {
        name: "logo-v3-final.png",
        url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
        mimeType: "image/png",
        size: 312320,
        width: 800,
        height: 600,
        versionId: logoV3.id,
      },
      {
        name: "logo-v3-mono.png",
        url: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop",
        mimeType: "image/png",
        size: 198656,
        width: 800,
        height: 600,
        versionId: logoV3.id,
      },
    ],
  });

  // Feedback for Logo versions
  const fb1 = await prisma.feedback.create({
    data: {
      content: "Love concept B! The geometric shape feels very aligned with our tech-forward brand. Can we see it with a heavier weight?",
      author: "Maya Chen (Nova Labs)",
      resolved: true,
      versionId: logoV1.id,
    },
  });

  await prisma.feedbackReply.create({
    data: {
      content: "Absolutely, I'll bring the weight up and also explore how it reads at small sizes. Expect v2 by Friday.",
      author: "Alex Rivera",
      feedbackId: fb1.id,
    },
  });

  const fb2 = await prisma.feedback.create({
    data: {
      content: "The spacing feels much better now. One thing — can the wordmark have a bit more breathing room from the icon?",
      author: "Maya Chen (Nova Labs)",
      resolved: true,
      versionId: logoV2.id,
    },
  });

  await prisma.feedbackReply.create({
    data: {
      content: "Good catch. I adjusted the lockup with 16px separation — feels much cleaner.",
      author: "Alex Rivera",
      feedbackId: fb2.id,
    },
  });

  const fb3 = await prisma.feedback.create({
    data: {
      content: "This looks great! Just one final request — can we get a version on a dark navy background to see how it plays?",
      author: "Maya Chen (Nova Labs)",
      resolved: false,
      versionId: logoV3.id,
    },
  });

  // Time Entries
  await prisma.timeEntry.createMany({
    data: [
      {
        description: "Initial concept exploration",
        duration: 180,
        date: new Date("2024-07-20"),
        userId: user.id,
        projectId: projectNovaBrand.id,
        deliverableId: dLogo.id,
      },
      {
        description: "Client presentation prep",
        duration: 60,
        date: new Date("2024-07-20"),
        userId: user.id,
        projectId: projectNovaBrand.id,
        deliverableId: dLogo.id,
      },
      {
        description: "Revisions after v1 feedback",
        duration: 150,
        date: new Date("2024-07-25"),
        userId: user.id,
        projectId: projectNovaBrand.id,
        deliverableId: dLogo.id,
      },
      {
        description: "Final refinements + color variants",
        duration: 120,
        date: new Date("2024-07-30"),
        userId: user.id,
        projectId: projectNovaBrand.id,
        deliverableId: dLogo.id,
      },
      {
        description: "Brand guidelines — typography section",
        duration: 200,
        date: new Date("2024-08-01"),
        userId: user.id,
        projectId: projectNovaBrand.id,
        deliverableId: dBrandGuide.id,
      },
      {
        description: "Discovery call + moodboard",
        duration: 90,
        date: new Date("2024-07-15"),
        userId: user.id,
        projectId: projectNovaWeb.id,
      },
      {
        description: "Brand refresh concepts",
        duration: 240,
        date: new Date("2024-07-18"),
        userId: user.id,
        projectId: projectPeachBrand.id,
      },
    ],
  });

  // Peach deliverables
  const peachLogo = await prisma.deliverable.create({
    data: {
      name: "Updated Logomark",
      description: "Refreshed version of existing mark",
      type: "LOGO",
      status: "APPROVED",
      sortOrder: 0,
      projectId: projectPeachBrand.id,
    },
  });

  const peachLogoV1 = await prisma.version.create({
    data: {
      number: 1,
      notes: "Subtle geometric update — retains warmth but feels more refined.",
      status: "APPROVED",
      deliverableId: peachLogo.id,
    },
  });

  await prisma.asset.create({
    data: {
      name: "peach-logo-v1.png",
      url: "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800&h=600&fit=crop",
      mimeType: "image/png",
      size: 156000,
      versionId: peachLogoV1.id,
    },
  });

  await prisma.feedback.create({
    data: {
      content: "This is exactly what we were looking for! The updated mark feels fresh but still us. Approved!",
      author: "Sophie T. (Peach & Co)",
      resolved: true,
      versionId: peachLogoV1.id,
    },
  });

  console.log("✅ Database seeded successfully");
  console.log("   Login: alex@forma.studio / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
