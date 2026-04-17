import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin2024", 12);

  // Admin: Eyuel Mulat
  const eyuel = await prisma.user.upsert({
    where: { email: "eyuel@studio.os" },
    update: {},
    create: {
      email: "eyuel@studio.os",
      name: "Eyuel Mulat",
      password,
      role: "ADMIN",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Eyuel",
    },
  });

  // Team members
  const sarah = await prisma.teamMember.create({
    data: {
      name: "Sarah Kim",
      email: "sarah@studio.os",
      role: "SENIOR_DESIGNER",
      color: "#3b82f6",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
      userId: eyuel.id,
    },
  });

  const mike = await prisma.teamMember.create({
    data: {
      name: "Mike Torres",
      email: "mike@studio.os",
      role: "JUNIOR_DESIGNER",
      color: "#10b981",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mike",
      userId: eyuel.id,
    },
  });

  const lena = await prisma.teamMember.create({
    data: {
      name: "Lena Park",
      email: "lena@studio.os",
      role: "ART_DIRECTOR",
      color: "#f59e0b",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Lena",
      userId: eyuel.id,
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
      userId: eyuel.id,
    },
  });

  const clientPeach = await prisma.client.create({
    data: {
      name: "Peach & Co",
      email: "studio@peachandco.com",
      company: "Peach & Co Interiors",
      color: "#f59e0b",
      status: "ACTIVE",
      userId: eyuel.id,
    },
  });

  const clientMeridian = await prisma.client.create({
    data: {
      name: "Meridian Finance",
      email: "brand@meridianfin.com",
      company: "Meridian Financial Group",
      color: "#10b981",
      status: "ACTIVE",
      userId: eyuel.id,
    },
  });

  const clientVolt = await prisma.client.create({
    data: {
      name: "Volt Digital",
      email: "hi@voltdigital.co",
      company: "Volt Digital Agency",
      color: "#ef4444",
      status: "ACTIVE",
      userId: eyuel.id,
    },
  });

  // Projects
  const pNovaBrand = await prisma.project.create({
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

  const pNovaWeb = await prisma.project.create({
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

  const pPeachBrand = await prisma.project.create({
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

  const pMeridianId = await prisma.project.create({
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

  const pVoltCampaign = await prisma.project.create({
    data: {
      name: "Campaign Creative",
      description: "Digital campaign assets, social media kit, and motion guidelines.",
      status: "IN_PROGRESS",
      color: "#ef4444",
      dueDate: new Date("2024-09-01"),
      budget: 6800,
      clientId: clientVolt.id,
    },
  });

  const pPeachPrint = await prisma.project.create({
    data: {
      name: "Print Collateral",
      description: "Business cards, letterhead, and brochure suite.",
      status: "PENDING",
      color: "#ec4899",
      dueDate: new Date("2024-10-01"),
      budget: 2500,
      clientId: clientPeach.id,
    },
  });

  // Deliverables — Nova Brand Identity
  const dLogo = await prisma.deliverable.create({
    data: {
      name: "Primary Logo",
      type: "LOGO",
      status: "IN_REVIEW",
      sortOrder: 0,
      projectId: pNovaBrand.id,
      dueDate: new Date("2024-08-10"),
    },
  });

  const dBrandGuide = await prisma.deliverable.create({
    data: {
      name: "Brand Guidelines",
      type: "BRAND_IDENTITY",
      status: "IN_PROGRESS",
      sortOrder: 1,
      projectId: pNovaBrand.id,
    },
  });

  const dBusinessCard = await prisma.deliverable.create({
    data: {
      name: "Business Cards",
      type: "BUSINESS_CARD",
      status: "PENDING",
      sortOrder: 2,
      projectId: pNovaBrand.id,
    },
  });

  const dSocial = await prisma.deliverable.create({
    data: {
      name: "Social Media Kit",
      type: "SOCIAL_MEDIA",
      status: "PENDING",
      sortOrder: 3,
      projectId: pNovaBrand.id,
    },
  });

  const dLogoApproved = await prisma.deliverable.create({
    data: {
      name: "Updated Logomark",
      type: "LOGO",
      status: "APPROVED",
      sortOrder: 0,
      projectId: pPeachBrand.id,
    },
  });

  const dPeachGuide = await prisma.deliverable.create({
    data: {
      name: "Color & Type Guide",
      type: "BRAND_IDENTITY",
      status: "IN_REVIEW",
      sortOrder: 1,
      projectId: pPeachBrand.id,
    },
  });

  // Meridian — all approved
  const dMeridianLogo = await prisma.deliverable.create({
    data: { name: "Logotype", type: "LOGO", status: "APPROVED", sortOrder: 0, projectId: pMeridianId.id },
  });
  const dMeridianCards = await prisma.deliverable.create({
    data: { name: "Business Cards", type: "BUSINESS_CARD", status: "APPROVED", sortOrder: 1, projectId: pMeridianId.id },
  });
  const dMeridianGuide = await prisma.deliverable.create({
    data: { name: "Brand Guidelines", type: "BRAND_IDENTITY", status: "APPROVED", sortOrder: 2, projectId: pMeridianId.id },
  });

  // Volt
  const dVoltBanner = await prisma.deliverable.create({
    data: { name: "Campaign Banners", type: "SOCIAL_MEDIA", status: "IN_PROGRESS", sortOrder: 0, projectId: pVoltCampaign.id },
  });
  const dVoltSocial = await prisma.deliverable.create({
    data: { name: "Social Templates", type: "SOCIAL_MEDIA", status: "PENDING", sortOrder: 1, projectId: pVoltCampaign.id },
  });

  // Versions for Logo
  const v1 = await prisma.version.create({
    data: {
      number: 1,
      notes: "Initial concept exploration — three directions presented.",
      status: "APPROVED",
      deliverableId: dLogo.id,
    },
  });
  const v2 = await prisma.version.create({
    data: {
      number: 2,
      notes: "Refined direction B based on client feedback.",
      status: "APPROVED",
      deliverableId: dLogo.id,
    },
  });
  const v3 = await prisma.version.create({
    data: {
      number: 3,
      notes: "Final adjustments — color variants and reversed versions.",
      status: "SENT",
      deliverableId: dLogo.id,
    },
  });

  const peachV1 = await prisma.version.create({
    data: {
      number: 1,
      notes: "Subtle geometric update — retains warmth but feels more refined.",
      status: "APPROVED",
      deliverableId: dLogoApproved.id,
    },
  });

  // Assets
  await prisma.asset.createMany({
    data: [
      { name: "logo-v1-concept-a.png", url: "https://images.unsplash.com/photo-1634942537034-2531766767d1?w=800&h=600&fit=crop", mimeType: "image/png", size: 204800, versionId: v1.id },
      { name: "logo-v1-concept-b.png", url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop", mimeType: "image/png", size: 189440, versionId: v1.id },
      { name: "logo-v2-refined.png", url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop", mimeType: "image/png", size: 245760, versionId: v2.id },
      { name: "logo-v3-final.png", url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop", mimeType: "image/png", size: 312320, versionId: v3.id },
      { name: "logo-v3-mono.png", url: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop", mimeType: "image/png", size: 198656, versionId: v3.id },
      { name: "peach-logo.png", url: "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800&h=600&fit=crop", mimeType: "image/png", size: 156000, versionId: peachV1.id },
    ],
  });

  // Feedback
  const fb1 = await prisma.feedback.create({
    data: { content: "Love concept B! The geometric shape feels very aligned with our tech-forward brand. Can we see it with a heavier weight?", author: "Maya Chen (Nova Labs)", resolved: true, versionId: v1.id },
  });
  await prisma.feedbackReply.create({
    data: { content: "Absolutely, I'll bring the weight up and explore how it reads at small sizes. Expect v2 by Friday.", author: "Eyuel Mulat", feedbackId: fb1.id },
  });
  const fb2 = await prisma.feedback.create({
    data: { content: "The spacing feels much better. Can the wordmark have a bit more breathing room from the icon?", author: "Maya Chen (Nova Labs)", resolved: true, versionId: v2.id },
  });
  await prisma.feedbackReply.create({
    data: { content: "Good catch. Adjusted the lockup with 16px separation — feels much cleaner.", author: "Eyuel Mulat", feedbackId: fb2.id },
  });
  await prisma.feedback.create({
    data: { content: "This looks great! One final request — can we get a version on a dark navy background?", author: "Maya Chen (Nova Labs)", resolved: false, versionId: v3.id },
  });
  await prisma.feedback.create({
    data: { content: "This is exactly what we were looking for! Approved!", author: "Sophie T. (Peach & Co)", resolved: true, versionId: peachV1.id },
  });

  // Time Entries
  await prisma.timeEntry.createMany({
    data: [
      { description: "Initial concept exploration", duration: 180, date: new Date("2024-07-20"), userId: eyuel.id, projectId: pNovaBrand.id, deliverableId: dLogo.id },
      { description: "Client presentation prep", duration: 60, date: new Date("2024-07-20"), userId: eyuel.id, projectId: pNovaBrand.id, deliverableId: dLogo.id },
      { description: "Revisions after v1 feedback", duration: 150, date: new Date("2024-07-25"), userId: eyuel.id, projectId: pNovaBrand.id, deliverableId: dLogo.id },
      { description: "Final refinements + color variants", duration: 120, date: new Date("2024-07-30"), userId: eyuel.id, projectId: pNovaBrand.id, deliverableId: dLogo.id },
      { description: "Brand guidelines — typography section", duration: 200, date: new Date("2024-08-01"), userId: eyuel.id, projectId: pNovaBrand.id, deliverableId: dBrandGuide.id },
      { description: "Discovery call + moodboard", duration: 90, date: new Date("2024-07-15"), userId: eyuel.id, projectId: pNovaWeb.id },
      { description: "Brand refresh concepts", duration: 240, date: new Date("2024-07-18"), userId: eyuel.id, projectId: pPeachBrand.id },
      { description: "Campaign brief review", duration: 60, date: new Date("2024-07-28"), userId: eyuel.id, projectId: pVoltCampaign.id },
      { description: "Banner design round 1", duration: 180, date: new Date("2024-07-29"), userId: eyuel.id, projectId: pVoltCampaign.id, deliverableId: dVoltBanner.id },
    ],
  });

  // Delegations
  await prisma.delegation.createMany({
    data: [
      {
        title: "Refine logo spacing — v3 feedback",
        description: "Client requested more breathing room between icon and wordmark. Apply to dark BG variant.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: new Date("2024-08-12"),
        teamMemberId: sarah.id,
        assignedById: eyuel.id,
        projectId: pNovaBrand.id,
      },
      {
        title: "Export brand guide assets",
        description: "Generate all final exports: SVG, PNG 1x/2x/3x, CMYK PDF for print.",
        status: "PENDING",
        priority: "MEDIUM",
        dueDate: new Date("2024-08-20"),
        teamMemberId: mike.id,
        assignedById: eyuel.id,
        projectId: pNovaBrand.id,
      },
      {
        title: "Social media template set",
        description: "Instagram, LinkedIn, Twitter cover and post templates. 5 layouts minimum.",
        status: "PENDING",
        priority: "MEDIUM",
        dueDate: new Date("2024-09-01"),
        teamMemberId: sarah.id,
        assignedById: eyuel.id,
        projectId: pVoltCampaign.id,
      },
      {
        title: "Creative direction for Volt campaign",
        description: "Review and approve all Volt campaign materials before client delivery.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        dueDate: new Date("2024-08-15"),
        teamMemberId: lena.id,
        assignedById: eyuel.id,
        projectId: pVoltCampaign.id,
      },
      {
        title: "Peach brand guidelines doc",
        description: "Compile all approved assets into the final brand guideline PDF.",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date("2024-07-28"),
        teamMemberId: mike.id,
        assignedById: eyuel.id,
        projectId: pPeachBrand.id,
      },
      {
        title: "Meridian print-ready files",
        description: "Prepare all Meridian assets for print production: bleed, crop marks, CMYK.",
        status: "DONE",
        priority: "HIGH",
        dueDate: new Date("2024-07-05"),
        teamMemberId: lena.id,
        assignedById: eyuel.id,
        projectId: pMeridianId.id,
      },
    ],
  });

  console.log("✅ Database seeded successfully");
  console.log("   Admin login: eyuel@studio.os / admin2024");
  console.log("   Team: Sarah Kim, Mike Torres, Lena Park");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
