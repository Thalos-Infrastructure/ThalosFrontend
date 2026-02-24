"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

type Lang = "en" | "es"

const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Navbar
    "nav.howItWorks": "How It Works",
    "nav.solutions": "Solutions",
    "nav.buildFlow": "Create Your Platform",
    "nav.signIn": "Sign In",
    "nav.signOut": "Sign Out",
    "nav.useCases": "Use Cases",

    // Hero
    "hero.tag": "Escrow Infrastructure on Stellar",
    "hero.title1": "Protected Payments.",
    "hero.title2": "Productive Capital.",
    "hero.desc": "Thalos powers agreements with programmable escrows on the Stellar network. Funds stay protected, milestones drive releases, and idle capital earns yield.",
    "hero.cta1": "Get Started",
    "hero.cta2": "See How It Works",
    "hero.weAre": "a decentralized escrow and trust infrastructure built on Stellar that enables secure, programmable, milestone-based payments between individuals, entrepreneurs, and businesses across multiple industries without relying on traditional intermediaries.",
    "hero.trustLayer": "The Trust Layer",
    "hero.trust1": "Thalos solves the trust problem in digital and high-value transactions by locking funds on-chain until predefined conditions are met. It combines smart-contract-based escrow, wallet-based identity, and transparent agreement tracking to reduce fraud, disputes, payment delays, and counterparty risk.",
    "hero.trust2a": "Unlike traditional platforms that extract high fees, impose custodial control, or limit flexibility, Thalos is ",
    "hero.trust2highlight": "non-custodial, transparent, and programmable",
    "hero.trust2b": ", making it adaptable to freelance services, commerce, real estate, agriculture, event management, enterprise procurement, and many other sectors.",
    "hero.trust3": "If you want to start a business and you are unsure how to securely receive payments from new clients or partners, Thalos provides a reliable integration layer that ensures funds are protected, conditions are enforced, and transactions are executed transparently.",

    // How It Works
    "hiw.tag": "[How It Works]",
    "hiw.title": "Agreement-Based Escrow Flow",
    "hiw.desc": "See how Thalos creates secure agreements with milestone-based escrow, on-chain fund locking, and conditional releases on Stellar.",
    "hiw.freelancer": "Freelancer",
    "hiw.travel": "Travel Agency",
    "hiw.marketplace": "Marketplace",
    "hiw.vehicle": "Vehicle Sale",
    "hiw.serviceContract": "Service Contract",

    // Where Thalos Applies
    "profiles.tag": "[Where Thalos Applies]",
    "profiles.desc": "Anywhere there is counterparty risk, payment uncertainty, milestone delivery, high-value exchange, or cross-border friction — Thalos can apply.",

    // Profiles
    "profiles.personal": "Personal",
    "profiles.personalDesc": "Protect your freelance payments, rental deposits, and peer-to-peer transactions with simple escrow agreements.",
    "profiles.business": "Enterprise",
    "profiles.businessDesc": "Manage travel packages, marketplace transactions, and high-value deals with advanced escrow workflows and team tools.",
    "profiles.cta": "Explore",
    "profiles.personalF1": "Freelancer escrows",
    "profiles.personalF2": "Planned payment schedules",
    "profiles.personalF3": "Individual buyer protection",
    "profiles.personalF4": "Yield on idle funds",
    "profiles.businessF1": "Multi-party escrows",
    "profiles.businessF2": "Travel & marketplace solutions",
    "profiles.businessF3": "API access & integrations",
    "profiles.businessF4": "Custom payment flows",

    // Use Cases
    "useCases.tag": "[Use Cases]",
    "useCases.title": "One Platform, Many Solutions",
    "useCases.desc": "From freelancers securing project payments to enterprises managing multi-party procurement, Thalos provides the trust infrastructure for every transaction that matters.",

    // Platform Builder
    "builder.tag": "[Platform Builder]",
    "builder.title": "Build Your Agreement Flow",
    "builder.desc": "Select the services and roles that match your use case. Thalos assembles the agreement infrastructure for you.",
    "builder.step1": "Select Services",
    "builder.step2": "Identity & Roles",
    "builder.step3": "Payment Logic",
    "builder.step4": "Review",
    "builder.back": "Back",
    "builder.next": "Next Step",
    "builder.create": "Create Payment Flow",
    "builder.selectServices": "Select Services",
    "builder.selectServicesDesc": "Choose the building blocks for your payment platform.",
    "builder.identityRoles": "Identity & Roles",
    "builder.identityRolesDesc": "Define the participants in your payment flow.",
    "builder.paymentLogic": "Payment Logic",
    "builder.paymentLogicDesc": "Choose how funds are released in your escrow flow.",
    "builder.reviewTitle": "Review Your Configuration",
    "builder.flowPreview": "Flow Preview",

    // Dashboard Section (landing)
    "dash.tag": "[Dashboard]",
    "dash.title": "Manage Your Agreements",
    "dash.desc": "Track active agreements, monitor fund status, and manage releases from a single view.",
    "dash.activeAgreements": "Active Agreements",
    "dash.totalLocked": "Total Locked",
    "dash.totalYield": "Total Yield",
    "dash.completed": "Completed",
    "dash.view": "View",
    "dash.release": "Release",
    "dash.milestones": "Milestones",
    "dash.conditions": "Conditions",
    "dash.contract": "Contract",

    // FAQ
    "faq.tag": "[FAQ]",
    "faq.title": "Frequently Asked Questions",
    "faq.q1": "What is Thalos?",
    "faq.a1": "Thalos is a decentralized escrow and trust infrastructure built on the Stellar network. It enables secure, programmable, milestone-based payments between individuals, entrepreneurs, and businesses without relying on traditional intermediaries.",
    "faq.q2": "How does the escrow work?",
    "faq.a2": "When an agreement is created, funds are locked in a Stellar smart contract. They are only released when predefined conditions are met, such as milestone completion, delivery confirmation, or mutual approval between parties.",
    "faq.q3": "What is USDC and why does Thalos use it?",
    "faq.a3": "USDC is a dollar-pegged stablecoin. Thalos uses USDC on Stellar for fast, low-cost settlements with price stability, eliminating the volatility risk associated with other cryptocurrencies.",
    "faq.q4": "Do I need a crypto wallet to use Thalos?",
    "faq.a4": "Yes. Thalos integrates with Stellar wallets like Freighter or Albedo. You can connect your existing wallet or create one during the onboarding process.",
    "faq.q5": "Is Thalos safe?",
    "faq.a5": "Funds are secured by Stellar smart contracts and are never held by Thalos itself. The escrow logic is trustless, meaning no single party can unilaterally move funds without meeting the agreed conditions.",
    "faq.q6": "What industries can use Thalos?",
    "faq.a6": "Thalos applies to any scenario with counterparty risk: real estate, freelancing, import/export, agriculture, events, software development, automotive sales, education, construction, and more.",
    "faq.q7": "How fast are settlements?",
    "faq.a7": "Stellar settles transactions in approximately 5 seconds with near-zero fees, making Thalos significantly faster and cheaper than traditional escrow or wire transfers.",
    "faq.q8": "Can businesses integrate Thalos into their platforms?",
    "faq.a8": "Yes. Thalos offers API access for businesses and marketplaces to embed programmable escrow directly into their workflows, creating custom payment flows at scale.",

    // Footer
    "footer.platform": "Platform",
    "footer.resources": "Resources",
    "footer.contact": "Contact",
    "footer.emailUs": "Email Us",
    "footer.followOnX": "Follow on X",
    "footer.rights": "All rights reserved.",
    "footer.visionTeam": "Vision & Mission",
    "footer.documentation": "Documentation",

    // Sign In
    "signin.welcome": "Welcome back",
    "signin.desc": "Access your agreements and protected funds.",
    "signin.accountType": "Account Type",
    "signin.personal": "Personal",
    "signin.enterprise": "Enterprise",
    "signin.google": "Continue with Google",
    "signin.email": "Continue with Email",
    "signin.or": "or",
    "signin.wallet": "Connect Stellar Wallet",
    "signin.freighter": "Connect with Freighter",
    "signin.freighterDesc": "Browser extension wallet for Stellar",
    "signin.walletConnecting": "Connecting…",
    "signin.walletError": "Could not connect. Install Freighter or unlock your wallet.",
    "signin.admin": "Admin",
    "signin.secured": "Secured by Thalos",

    // Dashboard pages
    "dashboard.myAgreements": "My Agreements",
    "dashboard.newAgreement": "New Agreement",
    "dashboard.viewAgreements": "View Agreements",
    "dashboard.personal": "Personal",
    "dashboard.business": "Enterprise",

    // Admin
    "admin.title": "Admin Dashboard",
    "admin.overview": "Overview",

    // Bottom bar
    "bar.navigation": "Navigation",
    "bar.contactUs": "Contact Us",
    "bar.scanMobile": "Scan to access Thalos Mobile",

    // Common
    "common.locked": "Locked",
    "common.partialRelease": "Partial Release",
    "common.completed": "Completed",
    "common.amount": "Amount",
    "common.time": "Time",
    "common.yield": "Yield",
    "common.progress": "Progress",
    "common.pending": "Pending",
    "common.funded": "Funded",
    "common.inProgress": "In Progress",
    "common.released": "Released",
    "common.awaitingApproval": "Awaiting Approval",

    // Stat cards
    "stat.protectedFunds": "Protected Funds",
    "stat.protectedFundsValue": "Escrow Smart Contracts",
    "stat.fastSettlement": "Fast Settlement",
    "stat.fastSettlementValue": "5 seconds on Stellar",
    "stat.programmable": "Programmable",
    "stat.programmableValue": "Custom payment logic",

    // Who Can Use Thalos
    "whoCanUse.tag": "[Who Can Use Thalos]",
    "whoCanUse.title": "Built for Everyone Who Needs Trust",
    "whoCanUse.desc": "Whether you are an independent freelancer, a growing startup, or a global enterprise, Thalos provides the programmable trust layer you need to transact with confidence.",
    "whoCanUse.freelancers": "Freelancers & Independents",
    "whoCanUse.freelancersDesc": "Protect your project payments with milestone-based escrows. Get paid on delivery, not on promises.",
    "whoCanUse.entrepreneurs": "Entrepreneurs & Startups",
    "whoCanUse.entrepreneursDesc": "Launch payment flows for your new venture. Secure early partnerships and client deposits without intermediaries.",
    "whoCanUse.businesses": "Businesses & Enterprises",
    "whoCanUse.businessesDesc": "Manage high-value procurement, vendor payments, and multi-party agreements at scale with full transparency.",
    "whoCanUse.marketplaces": "Marketplaces & Platforms",
    "whoCanUse.marketplacesDesc": "Embed programmable escrow into your platform. Protect buyers and sellers with automated fund releases.",
    "whoCanUse.agencies": "Travel & Service Agencies",
    "whoCanUse.agenciesDesc": "Secure travel packages, event contracts, and service agreements with conditional payment releases tied to deliverables.",
    "whoCanUse.developers": "Developers & Integrators",
    "whoCanUse.developersDesc": "Use the Thalos API to build custom escrow workflows into any application on the Stellar network.",

    // Vision & Mission
    "vision.tag": "[Vision & Mission]",
    "vision.title": "Building the Trust Layer for Global Commerce",
    "vision.vision": "Our Vision",
    "vision.visionText": "A world where every transaction, no matter how complex, is executed with trust, transparency, and programmable certainty, without relying on intermediaries.",
    "vision.mission": "Our Mission",
    "vision.missionText": "To build the leading decentralized escrow and trust infrastructure on Stellar, empowering individuals, entrepreneurs, and businesses to transact securely across industries and borders.",
    "vision.techTitle": "Core Technology Stack",
    "vision.techDesc": "Each layer of Thalos is designed to work together, creating a complete trust infrastructure for programmable payments.",
    "vision.T": "Transparency",
    "vision.TDesc": "Clear rules and visible conditions in every agreement.",
    "vision.h": "Hybrid",
    "vision.hDesc": "Efficient architecture combining operational speed with blockchain verification.",
    "vision.a": "Automation",
    "vision.aDesc": "Self-executing agreements powered by programmable logic.",
    "vision.l": "Liquidity",
    "vision.lDesc": "Funds secured with conditional release mechanisms.",
    "vision.o": "Orchestrated",
    "vision.oDesc": "Structured infrastructure where each party operates under predefined rules.",
    "vision.s": "Security",
    "vision.sDesc": "Non-custodial, cryptographic protection from start to finish.",
    "vision.visionExtended": "We envision a financial system where trust is not a prerequisite but a product of the system itself. Where a freelancer in Buenos Aires can work with a client in Berlin with the same certainty as a handshake between neighbors. Where every peso, dollar, and euro locked in an agreement works for everyone involved until the moment it is released.",
    "vision.missionExtended": "Thalos is more than a payment platform. It is a trust infrastructure designed for the real world, where agreements are complex, parties are global, and the cost of broken promises is high. We build on Stellar because speed, low cost, and accessibility matter. We integrate Trustless Work because non-custodial escrow should be the standard, not the exception.",

    // THALOS vertical words (vision page)
    "thalos.T": "Trust",
    "thalos.h": "Honor",
    "thalos.a": "Agreement",
    "thalos.l": "Logic",
    "thalos.o": "Openness",
    "thalos.s": "Security",

    // Team
    "team.title": "The Team",
    "team.desc": "The people building the trust layer for global commerce.",
    "team.leandro": "Leandro Masotti",
    "team.leandroRole": "Full Stack Developer",
    "team.diego": "Diego Raul",
    "team.diegoRole": "Full Stack Developer",
    "team.manuel": "Manuel Jimenez G",
    "team.manuelRole": "Product",

    // Get Involved
    "getInvolved.title": "Get Involved",
    "getInvolved.desc": "We are building infrastructure for the future of digital agreements and trust-minimized work. If you are interested in collaboration, feedback, or partnerships:",
    "getInvolved.email": "Email Us",
    "getInvolved.repo": "View Repository",

    // Partners
    "partners.builtOn": "Built on",
    "partners.escrowsBy": "Escrows by",

    // Status labels
    "status.funded": "Funded",
    "status.inProgress": "In Progress",
    "status.awaitingApproval": "Awaiting Approval",
    "status.released": "Released",
    "status.pending": "Pending",
    "status.approved": "Approved",

    // Wallet labels
    "wallet.corporate": "Corporate Wallet",
    "wallet.operations": "Operations Wallet",
    "wallet.treasury": "Treasury Wallet",
    "wallet.personal": "Personal Wallet",
    "wallet.savings": "Savings Wallet",

    // Use-case labels
    "useCase.carRental": "Car Rental Company",
    "useCase.travel": "Travel Agency Package",
    "useCase.dealership": "Car Dealership Sale",
    "useCase.rentalPlatform": "Short-Term Rental Platform",
    "useCase.event": "Event Management Contract",
    "useCase.other": "Other",
    "useCase.freelance": "Freelance Work",
    "useCase.marketplace": "Marketplace Purchase",
    "useCase.realEstate": "Real Estate",
    "useCase.service": "Service Agreement",

    // Wizard steps & labels
    "wizard.escrowType": "Escrow Type",
    "wizard.useCase": "Use Case",
    "wizard.agreementInfo": "Agreement Info",
    "wizard.paymentWallets": "Payment & Wallets",
    "wizard.reviewSend": "Review & Send",
    "wizard.howPayment": "How should the payment work?",
    "wizard.chooseFunds": "Choose how funds will be released.",
    "wizard.oneTimePayment": "One-time Payment",
    "wizard.oneTimeDesc": "Funds released all at once upon completion.",
    "wizard.milestoneBased": "Milestone-based",
    "wizard.milestoneDesc": "Funds released in stages as work progresses.",
    "wizard.whatAgreement": "What is this agreement for?",
    "wizard.selectCategory": "Select the business category or choose Other.",
    "wizard.basedOn": "Based on",
    "wizard.titleLabel": "Title",
    "wizard.titlePlaceholder": "e.g. Fleet Vehicle Purchase Q2",
    "wizard.descLabel": "Description",
    "wizard.agreementDesc": "Scope of the enterprise agreement...",
    "wizard.paymentDetails": "Payment Details",
    "wizard.selectWalletInfo": "Select wallet and counterparty info.",
    "wizard.yourWallet": "Your Wallet",
    "wizard.connectedWallet": "Your connected wallet",
    "wizard.releaseSignerWallet": "Release Signer Wallet",
    "wizard.whoReleases": "Who releases the funds",
    "wizard.amount": "Amount",
    "wizard.paymentStages": "Payment Stages",
    "wizard.addStage": "+ Add Stage",
    "wizard.stageDesc": "Stage description...",
    "wizard.total": "Total",
    "wizard.reviewAndSend": "Review & Send",
    "wizard.confirmDetails": "Confirm and notify the Release Signer.",
    "wizard.agreement": "Agreement",
    "wizard.untitled": "Untitled",
    "wizard.noDescription": "No description",
    "wizard.protectedFunds": "Protected Funds",
    "wizard.platformFeeLabel": "Platform fee:",
    "wizard.emailNotifications": "Email Notifications",
    "wizard.releaseSignerEmail": "Release Signer Email",
    "wizard.yourEmailOptional": "Your Email (optional)",
    "wizard.receiveCopy": "Receive a copy",
    "wizard.back": "Back",
    "wizard.continue": "Continue",
    "wizard.createNotify": "Create & Notify Signer",
    "wizard.agreementCreated": "Agreement Created",
    "wizard.agreementCreatedDesc": "Your escrow has been submitted. The Release Signer has been notified.",
    "wizard.scanQR": "Scan to access on mobile",
    "wizard.copied": "Copied",
    "wizard.copyDetails": "Copy Details",
    "wizard.viewAgreements": "View Agreements",
    "wizard.describeUseCase": "Describe your use case",
    "wizard.useCasePlaceholder": "e.g. Vendor contract, licensing deal...",
    "wizard.preFilled": "We pre-filled suggestions. Feel free to edit.",
    "wizard.describeAgreement": "Describe this agreement.",
    "wizard.personalTitlePlaceholder": "e.g. Apartment deposit",
    "wizard.personalDescPlaceholder": "Describe the agreement terms...",

    // Theme
    "theme.light": "Light",
    "theme.dark": "Dark",
    "dashPage.analytics": "Analytics",

    // Dashboard page keys
    "dashPage.dashboard": "Dashboard",
    "dashPage.agreements": "Agreements",
    "dashPage.newAgreement": "New Agreement",
    "dashPage.wallets": "My Wallets",
    "dashPage.active": "Active",
    "dashPage.totalVolume": "Total Volume",
    "dashPage.yieldEarned": "Yield Earned",
    "dashPage.completed": "Completed",
    "dashPage.monthlyAgreements": "Monthly Agreements",
    "dashPage.volume": "Volume (USDC)",
    "dashPage.recentAgreements": "Recent Agreements",
    "dashPage.viewAll": "View All",
    "dashPage.totalBalance": "Total Balance",
    "dashPage.backToAgreements": "Back to Agreements",
    "dashPage.milestones": "milestones",
    "dashPage.releaseActions": "Release Actions",
    "dashPage.approveAgreement": "Approve Agreement",
    "dashPage.releaseAllFunds": "Release All Funds",
    "dashPage.releaseAllApproved": "Release All Approved",
    "dashPage.approveReleaseAll": "Approve & Release All",
    "dashPage.allReleased": "All Funds Released",
    "dashPage.allReleasedDesc": "This agreement has been fully completed and all funds sent to the receiver.",
    "dashPage.approve": "Approve",
    "dashPage.releaseFunds": "Release Funds",
    "dashPage.released": "Released",
    "dashPage.approvedReady": "Approved - Ready to release",
    "dashPage.pendingApproval": "Pending approval",
    "dashPage.releasePerMilestone": "Release funds per milestone as each is approved.",
    "dashPage.releaseAllAtOnce": "Release all funds at once when all milestones are approved.",
    "dashPage.releaseUponCompletion": "Release all funds together upon full completion.",
    "dashPage.releaseStrategy": "Release strategy:",
    "dashPage.receiverWallet": "Receiver wallet:",
    "dashPage.signOut": "Sign Out",
    "dashPage.personal": "Personal",
    "dashPage.enterprise": "Enterprise",
    "dashPage.connectWallet": "Connect New Wallet",
    "dashPage.copyAddress": "Copy Address",
    "dashPage.viewExplorer": "View on Explorer",

    // Wizard steps
    "wizard.escrowType": "Escrow Type",
    "wizard.useCase": "Use Case",
    "wizard.agreementInfo": "Agreement Info",
    "wizard.paymentWallets": "Payment & Wallets",
    "wizard.reviewSend": "Review & Send",
    "wizard.singleRelease": "Single Release",
    "wizard.singleReleaseDesc": "One payment, one delivery",
    "wizard.multiRelease": "Multi Release",
    "wizard.multiReleaseDesc": "Multiple milestones, staged payments",
    "wizard.selectUseCase": "Select your use case",
    "wizard.title": "Title",
    "wizard.description": "Description",
    "wizard.senderWallet": "Sender Wallet",
    "wizard.counterpartyWallet": "Counterparty / Signer Wallet",
    "wizard.milestoneDesc": "Milestone Description",
    "wizard.amount": "Amount (USDC)",
    "wizard.addMilestone": "Add Milestone",
    "wizard.releaseStrategy": "Release Strategy",
    "wizard.perMilestone": "Per Milestone",
    "wizard.allAtOnce": "All at Once",
    "wizard.uponCompletion": "Upon Completion",
    "wizard.notifyEmail": "Notification Email",
    "wizard.signerEmail": "Signer Email",
    "wizard.platformAddress": "Platform Address",
    "wizard.disputeResolver": "Dispute Resolver",
    "wizard.trustline": "Trustline",
    "wizard.totalAmount": "Total Amount",
    "wizard.platformFee": "Platform Fee",
    "wizard.createAgreement": "Create Agreement",
    "wizard.createAnother": "Create Another",
    "wizard.success": "Agreement Created Successfully",
    "wizard.back": "Back",
    "wizard.next": "Next",
    "wizard.step": "Step",
    "wizard.of": "of",
    "wizard.advanced": "Advanced",
    "wizard.optional": "optional",
    "wizard.required": "Required",
    "wizard.copyJson": "Copy JSON",
    "wizard.engagementId": "Engagement ID",

    // Personal use cases
    "useCase.freelancer": "Freelancer Service",
    "useCase.rental": "Rental Agreement",
    "useCase.carSale": "Peer-to-Peer Car Sale",
    "useCase.coaching": "Online Coaching / Course",
    "useCase.homeRepair": "Home Repair Service",
    "useCase.other": "Other",

    // Business use cases
    "useCase.carRental": "Car Rental Company",
    "useCase.travel": "Travel Agency Package",
    "useCase.dealership": "Car Dealership Sale",
    "useCase.rentalPlatform": "Short-Term Rental Platform",
    "useCase.event": "Event Management Contract",

    // Wallets
    "wallet.main": "Main Wallet",
    "wallet.secondary": "Secondary Wallet",
    "wallet.corporate": "Corporate Wallet",
    "wallet.operations": "Operations Wallet",
    "wallet.treasury": "Treasury Wallet",

    // Status labels
    "status.funded": "Funded",
    "status.inProgress": "In Progress",
    "status.awaitingApproval": "Awaiting Approval",
    "status.released": "Released",
    "status.pending": "Pending",
    "status.approved": "Approved",

    // Built on / Escrows by
    "partners.builtOn": "Built on",
    "partners.escrowsBy": "Escrows by",

    // Wizard form labels
    "wizard.howPayment": "How should the payment work?",
    "wizard.chooseFunds": "Choose how funds will be released.",
    "wizard.oneTimePayment": "One-time Payment",
    "wizard.oneTimeDesc": "Funds released all at once upon completion.",
    "wizard.milestoneBased": "Milestone-based",
    "wizard.milestoneDesc": "Funds released in stages as work progresses.",
    "wizard.whatAgreement": "What is this agreement for?",
    "wizard.selectCategory": "Select a category to get guided suggestions, or choose Other.",
    "wizard.basedOn": "Based on",
    "wizard.yourWallet": "Your Wallet",
    "wizard.connectedWallet": "Your connected wallet",
    "wizard.counterpartyInfo": "Counterparty / Signer Wallet",
    "wizard.stellarAddress": "Stellar public key",
    "wizard.fullDelivery": "Full delivery",
    "wizard.remove": "Remove",
    "wizard.enterDesc": "Enter description...",
    "wizard.active": "Active",

    // Dashboard hardcoded labels
    "dashPage.newAgreementTitle": "New Agreement",
    "dashPage.avgAgreement": "Avg. Agreement",
    "dashPage.noAgreements": "No agreements found",
    "dashPage.noAgreementsDesc": "Create your first agreement to get started.",

    // Wizard step 2/3/4 labels
    "wizard.titleLabel": "Title",
    "wizard.descLabel": "Description",
    "wizard.paymentDetails": "Payment Details",
    "wizard.selectWalletInfo": "Select your wallet and enter the counterparty information.",
    "wizard.releaseSignerWallet": "Release Signer Wallet",
    "wizard.whoReleases": "Who releases the funds",
    "wizard.paymentStages": "Payment Stages",
    "wizard.addStage": "+ Add Stage",
    "wizard.stageDesc": "Stage description...",
    "wizard.total": "Total",
    "wizard.reviewAndSend": "Review & Send",
    "wizard.confirmDetails": "Confirm the details and send a notification to the Release Signer.",
    "wizard.agreement": "Agreement",
    "wizard.untitled": "Untitled",
    "wizard.noDescription": "No description",
    "wizard.protectedFunds": "Protected Funds",
    "wizard.platformFeeLabel": "Platform fee:",
    "wizard.emailNotifications": "Email Notifications",
    "wizard.releaseSignerEmail": "Release Signer Email",
    "wizard.yourEmailOptional": "Your Email (optional)",
    "wizard.receiveCopy": "Receive a copy",
    "wizard.back": "Back",
    "wizard.continue": "Continue",
    "wizard.createNotify": "Create & Notify Signer",
    "wizard.agreementDesc": "Brief description of the agreement scope...",
    "wizard.titlePlaceholder": "e.g. Website Redesign Project",
  },
  es: {
    // Navbar
    "nav.howItWorks": "Como Funciona",
    "nav.solutions": "Soluciones",
    "nav.buildFlow": "Crea Tu Plataforma",
    "nav.signIn": "Iniciar Sesion",
    "nav.signOut": "Cerrar Sesion",
    "nav.useCases": "Casos de Uso",

    // Hero
    "hero.tag": "Infraestructura de Escrow en Stellar",
    "hero.title1": "Pagos Protegidos.",
    "hero.title2": "Capital Productivo.",
    "hero.desc": "Thalos impulsa acuerdos con escrows programables en la red Stellar. Los fondos permanecen protegidos, los hitos impulsan las liberaciones y el capital inactivo genera rendimiento.",
    "hero.cta1": "Comenzar",
    "hero.cta2": "Ver Como Funciona",
    "hero.weAre": "una infraestructura descentralizada de escrow y confianza construida sobre Stellar que permite pagos seguros, programables y basados en hitos entre individuos, emprendedores y empresas de multiples industrias sin depender de intermediarios tradicionales.",
    "hero.trustLayer": "La Capa de Confianza",
    "hero.trust1": "Thalos resuelve el problema de confianza en transacciones digitales y de alto valor bloqueando fondos en la cadena hasta que se cumplan condiciones predefinidas. Combina escrow basado en contratos inteligentes, identidad basada en billeteras y seguimiento transparente de acuerdos para reducir fraudes, disputas, retrasos en pagos y riesgo de contraparte.",
    "hero.trust2a": "A diferencia de las plataformas tradicionales que cobran altas comisiones, imponen control custodial o limitan la flexibilidad, Thalos es ",
    "hero.trust2highlight": "no custodial, transparente y programable",
    "hero.trust2b": ", lo que lo hace adaptable a servicios freelance, comercio, bienes raices, agricultura, gestion de eventos, adquisiciones empresariales y muchos otros sectores.",
    "hero.trust3": "Si quieres iniciar un negocio y no estas seguro de como recibir pagos de forma segura de nuevos clientes o socios, Thalos proporciona una capa de integracion confiable que asegura que los fondos esten protegidos, las condiciones se cumplan y las transacciones se ejecuten de forma transparente.",

    // How It Works
    "hiw.tag": "[Como Funciona]",
    "hiw.title": "Flujo de Escrow Basado en Acuerdos",
    "hiw.desc": "Descubre como Thalos crea acuerdos seguros con escrow basado en hitos, bloqueo de fondos en cadena y liberaciones condicionales en Stellar.",
    "hiw.freelancer": "Freelancer",
    "hiw.travel": "Agencia de Viajes",
    "hiw.marketplace": "Marketplace",
    "hiw.vehicle": "Venta de Vehiculo",
    "hiw.serviceContract": "Contrato de Servicio",

    // Where Thalos Applies
    "profiles.tag": "[Donde Aplica Thalos]",
    "profiles.desc": "Donde exista riesgo de contraparte, incertidumbre en pagos, entrega por hitos, intercambios de alto valor o friccion transfronteriza — Thalos puede aplicarse.",

    // Profiles
    "profiles.personal": "Personal",
    "profiles.personalDesc": "Protege tus pagos freelance, depositos de alquiler y transacciones entre pares con acuerdos de escrow simples.",
    "profiles.business": "Empresa",
    "profiles.businessDesc": "Gestiona paquetes de viaje, transacciones de marketplace y acuerdos de alto valor con flujos de escrow avanzados y herramientas de equipo.",
    "profiles.cta": "Explorar",
    "profiles.personalF1": "Escrows para freelancers",
    "profiles.personalF2": "Calendarios de pagos planificados",
    "profiles.personalF3": "Proteccion individual del comprador",
    "profiles.personalF4": "Rendimiento sobre fondos inactivos",
    "profiles.businessF1": "Escrows multi-parte",
    "profiles.businessF2": "Soluciones para viajes y marketplaces",
    "profiles.businessF3": "Acceso a API e integraciones",
    "profiles.businessF4": "Flujos de pago personalizados",

    // Use Cases
    "useCases.tag": "[Casos de Uso]",
    "useCases.title": "Una Plataforma, Muchas Soluciones",
    "useCases.desc": "Desde freelancers asegurando pagos de proyectos hasta empresas gestionando adquisiciones multi-parte, Thalos provee la infraestructura de confianza para cada transaccion que importa.",

    // Platform Builder
    "builder.tag": "[Constructor de Plataforma]",
    "builder.title": "Construye Tu Flujo de Acuerdos",
    "builder.desc": "Selecciona los servicios y roles que coincidan con tu caso de uso. Thalos ensambla la infraestructura de acuerdos por ti.",
    "builder.step1": "Seleccionar Servicios",
    "builder.step2": "Identidad y Roles",
    "builder.step3": "Logica de Pago",
    "builder.step4": "Revisar",
    "builder.back": "Atras",
    "builder.next": "Siguiente",
    "builder.create": "Crear Flujo de Pago",
    "builder.selectServices": "Seleccionar Servicios",
    "builder.selectServicesDesc": "Elige los bloques de construccion para tu plataforma de pagos.",
    "builder.identityRoles": "Identidad y Roles",
    "builder.identityRolesDesc": "Define los participantes en tu flujo de pago.",
    "builder.paymentLogic": "Logica de Pago",
    "builder.paymentLogicDesc": "Elige como se liberan los fondos en tu flujo de escrow.",
    "builder.reviewTitle": "Revisa Tu Configuracion",
    "builder.flowPreview": "Vista Previa del Flujo",

    // Dashboard Section (landing)
    "dash.tag": "[Panel]",
    "dash.title": "Administra Tus Acuerdos",
    "dash.desc": "Rastrea acuerdos activos, monitorea el estado de los fondos y gestiona liberaciones desde una sola vista.",
    "dash.activeAgreements": "Acuerdos Activos",
    "dash.totalLocked": "Total Bloqueado",
    "dash.totalYield": "Rendimiento Total",
    "dash.completed": "Completados",
    "dash.view": "Ver",
    "dash.release": "Liberar",
    "dash.milestones": "Hitos",
    "dash.conditions": "Condiciones",
    "dash.contract": "Contrato",

    // FAQ
    "faq.tag": "[Preguntas Frecuentes]",
    "faq.title": "Preguntas Frecuentes",
    "faq.q1": "Que es Thalos?",
    "faq.a1": "Thalos es una infraestructura descentralizada de escrow y confianza construida sobre la red Stellar. Permite pagos seguros, programables y basados en hitos entre individuos, emprendedores y empresas sin depender de intermediarios tradicionales.",
    "faq.q2": "Como funciona el escrow?",
    "faq.a2": "Cuando se crea un acuerdo, los fondos se bloquean en un contrato inteligente de Stellar. Solo se liberan cuando se cumplen las condiciones predefinidas, como la finalizacion de hitos, confirmacion de entrega o aprobacion mutua entre las partes.",
    "faq.q3": "Que es USDC y por que Thalos lo utiliza?",
    "faq.a3": "USDC es una stablecoin vinculada al dolar. Thalos usa USDC en Stellar para liquidaciones rapidas y de bajo costo con estabilidad de precio, eliminando el riesgo de volatilidad asociado con otras criptomonedas.",
    "faq.q4": "Necesito una billetera cripto para usar Thalos?",
    "faq.a4": "Si. Thalos se integra con billeteras Stellar como Freighter o Albedo. Puedes conectar tu billetera existente o crear una durante el proceso de incorporacion.",
    "faq.q5": "Es seguro Thalos?",
    "faq.a5": "Los fondos estan asegurados por contratos inteligentes de Stellar y nunca son retenidos por Thalos. La logica del escrow es trustless, lo que significa que ninguna parte puede mover fondos unilateralmente sin cumplir las condiciones acordadas.",
    "faq.q6": "Que industrias pueden usar Thalos?",
    "faq.a6": "Thalos aplica a cualquier escenario con riesgo de contraparte: bienes raices, freelancing, importacion/exportacion, agricultura, eventos, desarrollo de software, ventas automotrices, educacion, construccion y mas.",
    "faq.q7": "Que tan rapidas son las liquidaciones?",
    "faq.a7": "Stellar liquida transacciones en aproximadamente 5 segundos con comisiones casi nulas, haciendo que Thalos sea significativamente mas rapido y economico que los escrows o transferencias bancarias tradicionales.",
    "faq.q8": "Pueden las empresas integrar Thalos en sus plataformas?",
    "faq.a8": "Si. Thalos ofrece acceso API para que empresas y marketplaces integren escrow programable directamente en sus flujos de trabajo, creando flujos de pago personalizados a escala.",

    // Footer
    "footer.platform": "Plataforma",
    "footer.resources": "Recursos",
    "footer.contact": "Contacto",
    "footer.emailUs": "Escribenos",
    "footer.followOnX": "Siguenos en X",
    "footer.rights": "Todos los derechos reservados.",
    "footer.visionTeam": "Vision y Mision",
    "footer.documentation": "Documentacion",

    // Sign In
    "signin.welcome": "Bienvenido de nuevo",
    "signin.desc": "Accede a tus acuerdos y fondos protegidos.",
    "signin.accountType": "Tipo de Cuenta",
    "signin.personal": "Personal",
    "signin.enterprise": "Empresa",
    "signin.google": "Continuar con Google",
    "signin.email": "Continuar con Email",
    "signin.or": "o",
    "signin.wallet": "Conectar Billetera Stellar",
    "signin.freighter": "Conectar con Freighter",
    "signin.freighterDesc": "Extensión de navegador para Stellar",
    "signin.walletConnecting": "Conectando…",
    "signin.walletError": "No se pudo conectar. Instala Freighter o desbloquea tu billetera.",
    "signin.admin": "Admin",
    "signin.secured": "Protegido por Thalos",

    // Dashboard pages
    "dashboard.myAgreements": "Mis Acuerdos",
    "dashboard.newAgreement": "Nuevo Acuerdo",
    "dashboard.viewAgreements": "Ver Acuerdos",
    "dashboard.personal": "Personal",
    "dashboard.business": "Empresa",

    // Admin
    "admin.title": "Panel de Administracion",
    "admin.overview": "Resumen",

    // Bottom bar
    "bar.navigation": "Navegacion",
    "bar.contactUs": "Contactanos",
    "bar.scanMobile": "Escanea para acceder a Thalos Mobile",

    // Common
    "common.locked": "Bloqueado",
    "common.partialRelease": "Liberacion Parcial",
    "common.completed": "Completado",
    "common.amount": "Monto",
    "common.time": "Tiempo",
    "common.yield": "Rendimiento",
    "common.progress": "Progreso",
    "common.pending": "Pendiente",
    "common.funded": "Fondos Depositados",
    "common.inProgress": "En Progreso",
    "common.released": "Liberado",
    "common.awaitingApproval": "Esperando Aprobacion",

    // Stat cards
    "stat.protectedFunds": "Fondos Protegidos",
    "stat.protectedFundsValue": "Contratos Inteligentes de Escrow",
    "stat.fastSettlement": "Liquidacion Rapida",
    "stat.fastSettlementValue": "5 segundos en Stellar",
    "stat.programmable": "Programable",
    "stat.programmableValue": "Logica de pago personalizada",

    // Who Can Use Thalos
    "whoCanUse.tag": "[Quien Puede Usar Thalos]",
    "whoCanUse.title": "Construido para Todos los que Necesitan Confianza",
    "whoCanUse.desc": "Ya seas un freelancer independiente, una startup en crecimiento o una empresa global, Thalos proporciona la capa de confianza programable que necesitas para realizar transacciones con seguridad.",
    "whoCanUse.freelancers": "Freelancers e Independientes",
    "whoCanUse.freelancersDesc": "Protege tus pagos de proyectos con escrows basados en hitos. Cobra al entregar, no por promesas.",
    "whoCanUse.entrepreneurs": "Emprendedores y Startups",
    "whoCanUse.entrepreneursDesc": "Lanza flujos de pago para tu nuevo emprendimiento. Asegura alianzas tempranas y depositos de clientes sin intermediarios.",
    "whoCanUse.businesses": "Negocios y Empresas",
    "whoCanUse.businessesDesc": "Gestiona adquisiciones de alto valor, pagos a proveedores y acuerdos multi-parte a escala con total transparencia.",
    "whoCanUse.marketplaces": "Marketplaces y Plataformas",
    "whoCanUse.marketplacesDesc": "Integra escrow programable en tu plataforma. Protege compradores y vendedores con liberaciones automaticas de fondos.",
    "whoCanUse.agencies": "Agencias de Viajes y Servicios",
    "whoCanUse.agenciesDesc": "Asegura paquetes de viaje, contratos de eventos y acuerdos de servicios con liberaciones de pago condicionales.",
    "whoCanUse.developers": "Desarrolladores e Integradores",
    "whoCanUse.developersDesc": "Usa la API de Thalos para construir flujos de escrow personalizados en cualquier aplicacion sobre la red Stellar.",

    // Vision & Mission
    "vision.tag": "[Vision y Mision]",
    "vision.title": "Construyendo la Capa de Confianza para el Comercio Global",
    "vision.vision": "Nuestra Vision",
    "vision.visionText": "Un mundo donde cada transaccion, sin importar su complejidad, se ejecuta con confianza, transparencia y certeza programable, sin depender de intermediarios.",
    "vision.mission": "Nuestra Mision",
    "vision.missionText": "Construir la infraestructura descentralizada de escrow y confianza lider sobre Stellar, empoderando a individuos, emprendedores y empresas para realizar transacciones seguras a traves de industrias y fronteras.",
    "vision.techTitle": "Stack Tecnologico Principal",
    "vision.techDesc": "Cada capa de Thalos esta disenada para trabajar en conjunto, creando una infraestructura de confianza completa para pagos programables.",
    "vision.T": "Transparencia",
    "vision.TDesc": "Reglas claras y condiciones visibles en cada acuerdo.",
    "vision.h": "Hibrido",
    "vision.hDesc": "Arquitectura eficiente que combina velocidad operativa con verificacion blockchain.",
    "vision.a": "Automatizacion",
    "vision.aDesc": "Acuerdos autoejecutables impulsados por logica programable.",
    "vision.l": "Liquidez",
    "vision.lDesc": "Fondos asegurados con mecanismos de liberacion condicional.",
    "vision.o": "Orquestado",
    "vision.oDesc": "Infraestructura estructurada donde cada parte opera bajo reglas predefinidas.",
    "vision.s": "Seguridad",
    "vision.sDesc": "Proteccion criptografica no custodial de principio a fin.",
    "vision.visionExtended": "Imaginamos un sistema financiero donde la confianza no sea un requisito previo, sino un producto del propio sistema. Donde un freelancer en Buenos Aires pueda trabajar con un cliente en Berlin con la misma certeza que un apreton de manos entre vecinos. Donde cada peso, dolar y euro bloqueado en un acuerdo trabaje para todos los involucrados hasta el momento de su liberacion.",
    "vision.missionExtended": "Thalos es mas que una plataforma de pagos. Es una infraestructura de confianza disenada para el mundo real, donde los acuerdos son complejos, las partes son globales y el costo de las promesas rotas es alto. Construimos sobre Stellar porque la velocidad, el bajo costo y la accesibilidad importan. Integramos Trustless Work porque el escrow no custodial deberia ser el estandar, no la excepcion.",
    "vision.trustlessWork": "Trustless Work",
    "vision.trustlessWorkDesc": "Impulsado por el protocolo de escrow Trustless Work para gestion de fondos descentralizada y no custodial.",

    // THALOS vertical words
    "thalos.T": "Confianza",
    "thalos.h": "Honor",
    "thalos.a": "Acuerdo",
    "thalos.l": "Logica",
    "thalos.o": "Apertura",
    "thalos.s": "Seguridad",

    // Team
    "team.title": "El Equipo",
    "team.desc": "Las personas construyendo la capa de confianza para el comercio global.",
    "team.leandro": "Leandro Masotti",
    "team.leandroRole": "Desarrollador Full Stack",
    "team.diego": "Diego Raul",
    "team.diegoRole": "Desarrollador Full Stack",
    "team.manuel": "Manuel Jimenez G",
    "team.manuelRole": "Producto",

    // Get Involved
    "getInvolved.title": "Participa",
    "getInvolved.desc": "Estamos construyendo infraestructura para el futuro de los acuerdos digitales y el trabajo con confianza minimizada. Si te interesa colaborar, dar feedback o establecer alianzas:",
    "getInvolved.email": "Escribenos",
    "getInvolved.repo": "Ver Repositorio",

    // Partners
    "partners.builtOn": "Construido en",
    "partners.escrowsBy": "Escrows por",

    // Status labels
    "status.funded": "Financiado",
    "status.inProgress": "En Progreso",
    "status.awaitingApproval": "Esperando Aprobacion",
    "status.released": "Liberado",
    "status.pending": "Pendiente",
    "status.approved": "Aprobado",

    // Wallet labels
    "wallet.corporate": "Billetera Corporativa",
    "wallet.operations": "Billetera de Operaciones",
    "wallet.treasury": "Billetera de Tesoreria",
    "wallet.personal": "Billetera Personal",
    "wallet.savings": "Billetera de Ahorros",

    // Use-case labels
    "useCase.carRental": "Empresa de Alquiler de Autos",
    "useCase.travel": "Paquete de Agencia de Viajes",
    "useCase.dealership": "Venta de Concesionaria",
    "useCase.rentalPlatform": "Plataforma de Alquiler Temporal",
    "useCase.event": "Contrato de Gestion de Eventos",
    "useCase.other": "Otro",
    "useCase.freelance": "Trabajo Freelance",
    "useCase.marketplace": "Compra en Marketplace",
    "useCase.realEstate": "Bienes Raices",
    "useCase.service": "Acuerdo de Servicio",

    // Wizard steps & labels
    "wizard.escrowType": "Tipo de Escrow",
    "wizard.useCase": "Caso de Uso",
    "wizard.agreementInfo": "Info del Acuerdo",
    "wizard.paymentWallets": "Pago y Billeteras",
    "wizard.reviewSend": "Revisar y Enviar",
    "wizard.howPayment": "Como debe funcionar el pago?",
    "wizard.chooseFunds": "Elige como se liberaran los fondos.",
    "wizard.oneTimePayment": "Pago Unico",
    "wizard.oneTimeDesc": "Fondos liberados de una vez al completar.",
    "wizard.milestoneBased": "Basado en Hitos",
    "wizard.milestoneDesc": "Fondos liberados en etapas segun el avance.",
    "wizard.whatAgreement": "Para que es este acuerdo?",
    "wizard.selectCategory": "Selecciona la categoria o elige Otro.",
    "wizard.basedOn": "Basado en",
    "wizard.titleLabel": "Titulo",
    "wizard.titlePlaceholder": "ej. Compra de Vehiculos de Flota Q2",
    "wizard.descLabel": "Descripcion",
    "wizard.agreementDesc": "Alcance del acuerdo empresarial...",
    "wizard.paymentDetails": "Detalles de Pago",
    "wizard.selectWalletInfo": "Selecciona billetera e informacion de contraparte.",
    "wizard.yourWallet": "Tu Billetera",
    "wizard.connectedWallet": "Tu billetera conectada",
    "wizard.releaseSignerWallet": "Billetera del Firmante de Liberacion",
    "wizard.whoReleases": "Quien libera los fondos",
    "wizard.amount": "Monto",
    "wizard.paymentStages": "Etapas de Pago",
    "wizard.addStage": "+ Agregar Etapa",
    "wizard.stageDesc": "Descripcion de la etapa...",
    "wizard.total": "Total",
    "wizard.reviewAndSend": "Revisar y Enviar",
    "wizard.confirmDetails": "Confirma y notifica al Firmante de Liberacion.",
    "wizard.agreement": "Acuerdo",
    "wizard.untitled": "Sin titulo",
    "wizard.noDescription": "Sin descripcion",
    "wizard.protectedFunds": "Fondos Protegidos",
    "wizard.platformFeeLabel": "Comision de plataforma:",
    "wizard.emailNotifications": "Notificaciones por Email",
    "wizard.releaseSignerEmail": "Email del Firmante de Liberacion",
    "wizard.yourEmailOptional": "Tu Email (opcional)",
    "wizard.receiveCopy": "Recibir una copia",
    "wizard.back": "Atras",
    "wizard.continue": "Continuar",
    "wizard.createNotify": "Crear y Notificar Firmante",
    "wizard.agreementCreated": "Acuerdo Creado",
    "wizard.agreementCreatedDesc": "Tu escrow ha sido enviado. El Firmante de Liberacion ha sido notificado.",
    "wizard.scanQR": "Escanea para acceder en movil",
    "wizard.copied": "Copiado",
    "wizard.copyDetails": "Copiar Detalles",
    "wizard.viewAgreements": "Ver Acuerdos",
    "wizard.describeUseCase": "Describe tu caso de uso",
    "wizard.useCasePlaceholder": "ej. Contrato de proveedor, acuerdo de licencia...",
    "wizard.preFilled": "Completamos sugerencias. Puedes editar libremente.",
    "wizard.describeAgreement": "Describe este acuerdo.",
    "wizard.personalTitlePlaceholder": "ej. Deposito de apartamento",
    "wizard.personalDescPlaceholder": "Describe los terminos del acuerdo...",

    // Theme
    "theme.light": "Claro",
    "theme.dark": "Oscuro",
    "dashPage.analytics": "Estadisticas",

    // Dashboard page keys
    "dashPage.dashboard": "Panel",
    "dashPage.agreements": "Acuerdos",
    "dashPage.newAgreement": "Nuevo Acuerdo",
    "dashPage.wallets": "Mis Billeteras",
    "dashPage.active": "Activos",
    "dashPage.totalVolume": "Volumen Total",
    "dashPage.yieldEarned": "Rendimiento Ganado",
    "dashPage.completed": "Completados",
    "dashPage.monthlyAgreements": "Acuerdos Mensuales",
    "dashPage.volume": "Volumen (USDC)",
    "dashPage.recentAgreements": "Acuerdos Recientes",
    "dashPage.viewAll": "Ver Todos",
    "dashPage.totalBalance": "Balance Total",
    "dashPage.backToAgreements": "Volver a Acuerdos",
    "dashPage.milestones": "hitos",
    "dashPage.releaseActions": "Acciones de Liberacion",
    "dashPage.approveAgreement": "Aprobar Acuerdo",
    "dashPage.releaseAllFunds": "Liberar Todos los Fondos",
    "dashPage.releaseAllApproved": "Liberar Todos los Aprobados",
    "dashPage.approveReleaseAll": "Aprobar y Liberar Todo",
    "dashPage.allReleased": "Todos los Fondos Liberados",
    "dashPage.allReleasedDesc": "Este acuerdo ha sido completado y todos los fondos enviados al receptor.",
    "dashPage.approve": "Aprobar",
    "dashPage.releaseFunds": "Liberar Fondos",
    "dashPage.released": "Liberado",
    "dashPage.approvedReady": "Aprobado - Listo para liberar",
    "dashPage.pendingApproval": "Pendiente de aprobacion",
    "dashPage.releasePerMilestone": "Liberar fondos por hito a medida que se aprueba cada uno.",
    "dashPage.releaseAllAtOnce": "Liberar todos los fondos de una vez cuando todos los hitos esten aprobados.",
    "dashPage.releaseUponCompletion": "Liberar todos los fondos juntos al completarse todo.",
    "dashPage.releaseStrategy": "Estrategia de liberacion:",
    "dashPage.receiverWallet": "Billetera receptora:",
    "dashPage.signOut": "Cerrar Sesion",
    "dashPage.personal": "Personal",
    "dashPage.enterprise": "Empresa",
    "dashPage.connectWallet": "Conectar Nueva Billetera",
    "dashPage.copyAddress": "Copiar Direccion",
    "dashPage.viewExplorer": "Ver en Explorador",

    // Wizard steps
    "wizard.escrowType": "Tipo de Escrow",
    "wizard.useCase": "Caso de Uso",
    "wizard.agreementInfo": "Info del Acuerdo",
    "wizard.paymentWallets": "Pago y Billeteras",
    "wizard.reviewSend": "Revisar y Enviar",
    "wizard.singleRelease": "Liberacion Unica",
    "wizard.singleReleaseDesc": "Un pago, una entrega",
    "wizard.multiRelease": "Liberacion Multiple",
    "wizard.multiReleaseDesc": "Multiples hitos, pagos escalonados",
    "wizard.selectUseCase": "Selecciona tu caso de uso",
    "wizard.title": "Titulo",
    "wizard.description": "Descripcion",
    "wizard.senderWallet": "Billetera del Remitente",
    "wizard.counterpartyWallet": "Billetera Contraparte / Firmante",
    "wizard.milestoneDesc": "Descripcion del Hito",
    "wizard.amount": "Monto (USDC)",
    "wizard.addMilestone": "Agregar Hito",
    "wizard.releaseStrategy": "Estrategia de Liberacion",
    "wizard.perMilestone": "Por Hito",
    "wizard.allAtOnce": "Todo de una Vez",
    "wizard.uponCompletion": "Al Completar",
    "wizard.notifyEmail": "Email de Notificacion",
    "wizard.signerEmail": "Email del Firmante",
    "wizard.platformAddress": "Direccion de Plataforma",
    "wizard.disputeResolver": "Resolutor de Disputas",
    "wizard.trustline": "Trustline",
    "wizard.totalAmount": "Monto Total",
    "wizard.platformFee": "Comision de Plataforma",
    "wizard.createAgreement": "Crear Acuerdo",
    "wizard.createAnother": "Crear Otro",
    "wizard.success": "Acuerdo Creado Exitosamente",
    "wizard.back": "Atras",
    "wizard.next": "Siguiente",
    "wizard.step": "Paso",
    "wizard.of": "de",
    "wizard.advanced": "Avanzado",
    "wizard.optional": "opcional",
    "wizard.required": "Requerido",
    "wizard.copyJson": "Copiar JSON",
    "wizard.engagementId": "ID de Compromiso",

    // Personal use cases
    "useCase.freelancer": "Servicio Freelance",
    "useCase.rental": "Contrato de Alquiler",
    "useCase.carSale": "Venta de Auto entre Pares",
    "useCase.coaching": "Coaching / Curso en Linea",
    "useCase.homeRepair": "Servicio de Reparacion del Hogar",
    "useCase.other": "Otro",

    // Business use cases
    "useCase.carRental": "Empresa de Alquiler de Autos",
    "useCase.travel": "Paquete de Agencia de Viajes",
    "useCase.dealership": "Venta de Concesionaria",
    "useCase.rentalPlatform": "Plataforma de Alquiler Temporal",
    "useCase.event": "Contrato de Gestion de Eventos",

    // Wallets
    "wallet.main": "Billetera Principal",
    "wallet.secondary": "Billetera Secundaria",
    "wallet.corporate": "Billetera Corporativa",
    "wallet.operations": "Billetera de Operaciones",
    "wallet.treasury": "Billetera de Tesoreria",

    // Status labels
    "status.funded": "Fondos Depositados",
    "status.inProgress": "En Progreso",
    "status.awaitingApproval": "Esperando Aprobacion",
    "status.released": "Liberado",
    "status.pending": "Pendiente",
    "status.approved": "Aprobado",

    // Built on / Escrows by
    "partners.builtOn": "Construido en",
    "partners.escrowsBy": "Escrows por",

    // Wizard form labels
    "wizard.howPayment": "Como deberia funcionar el pago?",
    "wizard.chooseFunds": "Elige como se liberaran los fondos.",
    "wizard.oneTimePayment": "Pago Unico",
    "wizard.oneTimeDesc": "Fondos liberados de una vez al completar.",
    "wizard.milestoneBased": "Basado en Hitos",
    "wizard.milestoneDesc": "Fondos liberados en etapas a medida que avanza el trabajo.",
    "wizard.whatAgreement": "Para que es este acuerdo?",
    "wizard.selectCategory": "Selecciona una categoria para obtener sugerencias, o elige Otro.",
    "wizard.basedOn": "Basado en",
    "wizard.yourWallet": "Tu Billetera",
    "wizard.connectedWallet": "Tu billetera conectada",
    "wizard.counterpartyInfo": "Billetera Contraparte / Firmante",
    "wizard.stellarAddress": "Clave publica de Stellar",
    "wizard.fullDelivery": "Entrega completa",
    "wizard.remove": "Eliminar",
    "wizard.enterDesc": "Ingresa descripcion...",
    "wizard.active": "Activo",

    // Dashboard hardcoded labels
    "dashPage.newAgreementTitle": "Nuevo Acuerdo",
    "dashPage.avgAgreement": "Acuerdo Prom.",
    "dashPage.noAgreements": "No se encontraron acuerdos",
    "dashPage.noAgreementsDesc": "Crea tu primer acuerdo para comenzar.",

    // Wizard step 2/3/4 labels
    "wizard.titleLabel": "Titulo",
    "wizard.descLabel": "Descripcion",
    "wizard.paymentDetails": "Detalles de Pago",
    "wizard.selectWalletInfo": "Selecciona tu billetera e ingresa la informacion de la contraparte.",
    "wizard.releaseSignerWallet": "Billetera del Firmante de Liberacion",
    "wizard.whoReleases": "Quien libera los fondos",
    "wizard.paymentStages": "Etapas de Pago",
    "wizard.addStage": "+ Agregar Etapa",
    "wizard.stageDesc": "Descripcion de la etapa...",
    "wizard.total": "Total",
    "wizard.reviewAndSend": "Revisar y Enviar",
    "wizard.confirmDetails": "Confirma los detalles y envia una notificacion al Firmante de Liberacion.",
    "wizard.agreement": "Acuerdo",
    "wizard.untitled": "Sin titulo",
    "wizard.noDescription": "Sin descripcion",
    "wizard.protectedFunds": "Fondos Protegidos",
    "wizard.platformFeeLabel": "Comision de plataforma:",
    "wizard.emailNotifications": "Notificaciones por Email",
    "wizard.releaseSignerEmail": "Email del Firmante de Liberacion",
    "wizard.yourEmailOptional": "Tu Email (opcional)",
    "wizard.receiveCopy": "Recibir una copia",
    "wizard.back": "Atras",
    "wizard.continue": "Continuar",
    "wizard.createNotify": "Crear y Notificar Firmante",
    "wizard.agreementDesc": "Breve descripcion del alcance del acuerdo...",
    "wizard.titlePlaceholder": "ej. Proyecto de Rediseno Web",
  },
}

type Theme = "dark" | "light"

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    const saved = localStorage.getItem("thalos-lang") as Lang | null
    if (saved && (saved === "en" || saved === "es")) setLangState(saved)
    const savedTheme = localStorage.getItem("thalos-theme") as Theme | null
    if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
      setThemeState(savedTheme)
      document.documentElement.classList.remove("dark", "light")
      document.documentElement.classList.add(savedTheme)
    }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem("thalos-lang", l)
  }, [])

  const setTheme = useCallback((th: Theme) => {
    setThemeState(th)
    localStorage.setItem("thalos-theme", th)
    document.documentElement.classList.remove("dark", "light")
    document.documentElement.classList.add(th)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  const t = useCallback((key: string) => {
    return translations[lang][key] || translations.en[key] || key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, theme, setTheme, toggleTheme }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

/** Small globe toggle button */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage()
  return (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className={`flex items-center gap-1.5 rounded-full border border-border/40 bg-secondary/50 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground hover:border-border ${className || ""}`}
      aria-label={lang === "en" ? "Cambiar a Espanol" : "Switch to English"}
      title={lang === "en" ? "Cambiar a Espanol" : "Switch to English"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      {lang === "en" ? "ES" : "EN"}
    </button>
  )
}

/** Sun/Moon theme toggle */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useLanguage()
  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-1.5 rounded-full border border-border/40 bg-secondary/50 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-all duration-300 hover:bg-secondary hover:text-foreground hover:border-border ${className || ""}`}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  )
}
