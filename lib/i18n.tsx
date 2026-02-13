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

    // Hero
    "hero.tag": "Escrow Infrastructure on Stellar",
    "hero.title1": "Protected Payments.",
    "hero.title2": "Productive Capital.",
    "hero.desc": "Thalos powers agreements with programmable escrows on the Stellar network. Funds stay protected, milestones drive releases, and idle capital earns yield.",
    "hero.cta1": "Get Started",
    "hero.cta2": "See How It Works",

    // How It Works
    "hiw.tag": "[How It Works]",
    "hiw.title": "Modular Payment Infrastructure",
    "hiw.desc": "See how Thalos connects fiat payments, USDC conversion, and smart contract escrows into a seamless flow tailored to your use case.",
    "hiw.freelancer": "Freelancer",
    "hiw.travel": "Travel Agency",
    "hiw.marketplace": "Marketplace",
    "hiw.vehicle": "Vehicle Sale",

    // Profiles
    "profiles.tag": "[Solutions]",
    "profiles.title": "One Platform, Many Solutions",
    "profiles.desc": "Whether you are a freelancer protecting milestone payments or a platform managing thousands of transactions, Thalos adapts to your needs.",
    "profiles.personal": "Personal",
    "profiles.personalDesc": "Protect your freelance payments, rental deposits, and peer-to-peer transactions with simple escrow agreements.",
    "profiles.business": "Enterprise",
    "profiles.businessDesc": "Manage travel packages, marketplace transactions, and high-value deals with advanced escrow workflows and team tools.",
    "profiles.cta": "Explore",

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

    // Footer
    "footer.platform": "Platform",
    "footer.resources": "Resources",
    "footer.contact": "Contact",
    "footer.emailUs": "Email Us",
    "footer.followOnX": "Follow on X",
    "footer.rights": "All rights reserved.",

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
  },
  es: {
    // Navbar
    "nav.howItWorks": "Como Funciona",
    "nav.solutions": "Soluciones",
    "nav.buildFlow": "Crea Tu Plataforma",
    "nav.signIn": "Iniciar Sesion",
    "nav.signOut": "Cerrar Sesion",

    // Hero
    "hero.tag": "Infraestructura de Escrow en Stellar",
    "hero.title1": "Pagos Protegidos.",
    "hero.title2": "Capital Productivo.",
    "hero.desc": "Thalos impulsa acuerdos con escrows programables en la red Stellar. Los fondos permanecen protegidos, los hitos impulsan las liberaciones y el capital inactivo genera rendimiento.",
    "hero.cta1": "Comenzar",
    "hero.cta2": "Ver Como Funciona",

    // How It Works
    "hiw.tag": "[Como Funciona]",
    "hiw.title": "Infraestructura de Pagos Modular",
    "hiw.desc": "Mira como Thalos conecta pagos fiat, conversion a USDC y escrows de contratos inteligentes en un flujo continuo adaptado a tu caso de uso.",
    "hiw.freelancer": "Freelancer",
    "hiw.travel": "Agencia de Viajes",
    "hiw.marketplace": "Marketplace",
    "hiw.vehicle": "Venta de Vehiculo",

    // Profiles
    "profiles.tag": "[Soluciones]",
    "profiles.title": "Una Plataforma, Muchas Soluciones",
    "profiles.desc": "Ya sea que seas un freelancer protegiendo pagos por hitos o una plataforma gestionando miles de transacciones, Thalos se adapta a tus necesidades.",
    "profiles.personal": "Personal",
    "profiles.personalDesc": "Protege tus pagos freelance, depositos de alquiler y transacciones entre pares con acuerdos de escrow simples.",
    "profiles.business": "Empresa",
    "profiles.businessDesc": "Gestiona paquetes de viaje, transacciones de marketplace y acuerdos de alto valor con flujos de escrow avanzados y herramientas de equipo.",
    "profiles.cta": "Explorar",

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

    // Footer
    "footer.platform": "Plataforma",
    "footer.resources": "Recursos",
    "footer.contact": "Contacto",
    "footer.emailUs": "Escribenos",
    "footer.followOnX": "Siguenos en X",
    "footer.rights": "Todos los derechos reservados.",

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
  },
}

interface LanguageContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en")

  useEffect(() => {
    const saved = localStorage.getItem("thalos-lang") as Lang | null
    if (saved && (saved === "en" || saved === "es")) setLangState(saved)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem("thalos-lang", l)
  }, [])

  const t = useCallback((key: string) => {
    return translations[lang][key] || translations.en[key] || key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
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
      className={`flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-muted-foreground transition-all duration-300 hover:bg-white/10 hover:text-foreground hover:border-white/20 ${className || ""}`}
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
