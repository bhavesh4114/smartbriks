import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useScroll } from "motion/react";
import {
  Building2,
  Menu,
  Play,
  Search,
  Wallet,
  TrendingUp,
  Shield,
  BarChart3,
  Lock,
  LayoutGrid,
  X,
} from "lucide-react";

// --------------------------------------------
// Constants
// --------------------------------------------
const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/properties" },
  { label: "About Us", href: "/about" },
  { label: "Resources", href: "/resources" },
];

const MEDIA_LOGOS = ["Forbes", "TechCrunch", "WSJ", "Bloomberg", "CNBC"];

const STEPS = [
  {
    icon: Search,
    title: "Browse Verified Properties",
    description:
      "Explore institutional-grade real estate assets vetted by our team.",
  },
  {
    icon: Wallet,
    title: "Invest Fractionally",
    description:
      "Buy shares from as low as ₹500. No large capital or paperwork.",
  },
  {
    icon: TrendingUp,
    title: "Earn Rental & Appreciation Returns",
    description:
      "Receive quarterly distributions and benefit from long-term appreciation.",
  },
];

const WHY_ITEMS = [
  {
    icon: Shield,
    title: "Verified Assets",
    description: "Every property is independently verified and due-diligenced.",
  },
  {
    icon: BarChart3,
    title: "Transparent Returns",
    description: "Real-time dashboards and clear reporting on your returns.",
  },
  {
    icon: Lock,
    title: "Secure Transactions",
    description: "Bank-grade security and regulated custody for your investments.",
  },
  {
    icon: LayoutGrid,
    title: "Professional Management",
    description: "Institutional operators manage each asset day to day.",
  },
];

const AVATAR_URLS = [
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=face",
];

// Hero video: city skyline / real estate vibe (free stock)
const HERO_VIDEO_SRC =
  "https://cdn.coverr.co/videos/coverr-aerial-view-of-a-city-at-dusk-3872/3872_preview.mp4";

// --------------------------------------------
// Motion variants
// --------------------------------------------
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

const stagger = (delay = 0.05) => ({
  visible: {
    transition: { staggerChildren: delay, delayChildren: 0.1 },
  },
});

// --------------------------------------------
// Home Page
// --------------------------------------------
export default function Home() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => setNavScrolled(v > 48));
    return () => unsub();
  }, [scrollY]);

  const closeMenu = () => setMenuOpen(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0f172a] font-sans antialiased text-[#111827]">
      {/* --------------------------------------------
          NAVBAR – sticky, transparent → glass on scroll; hamburger on mobile/tablet
      -------------------------------------------- */}
      <motion.header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        initial={false}
        animate={{
          backgroundColor: navScrolled ? "rgba(255,255,255,0.85)" : "transparent",
          backdropFilter: navScrolled ? "blur(12px)" : "none",
          borderBottomColor: navScrolled ? "rgba(229,231,235,0.6)" : "transparent",
        }}
        style={{ borderBottomWidth: 1 }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={closeMenu}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563eb] text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span
              className={`text-xl font-bold transition-colors ${navScrolled ? "text-[#111827]" : "text-white"}`}
            >
              SmartBrick
            </span>
          </Link>

          {/* Desktop: full nav + auth (≥1024px) */}
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`group relative inline-block text-sm font-medium transition-colors ${navScrolled ? "text-[#6B7280] hover:text-[#111827]" : "text-white/90 hover:text-white"}`}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#2563eb] transition-all duration-300 group-hover:w-full" />
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={`group relative inline-block text-sm font-medium transition-colors ${navScrolled ? "text-[#6B7280] hover:text-[#111827]" : "text-white/90 hover:text-white"}`}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#2563eb] transition-all duration-300 group-hover:w-full" />
                </a>
              )
            )}
          </nav>
          <div className="hidden shrink-0 items-center gap-2 sm:gap-3 lg:flex">
            <Link
              to="/investor/login"
              className={`min-h-[44px] min-w-[44px] rounded-xl px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${navScrolled ? "text-[#6B7280] hover:text-[#111827]" : "text-white/90 hover:text-white"}`}
            >
              Login
            </Link>
            <Link
              to="/investor/login"
              className="min-h-[44px] shrink-0 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:bg-[#1d4ed8] hover:scale-[1.02] hover:shadow-blue-600/30 sm:px-5"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile/Tablet: hamburger */}
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80 lg:hidden"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X className={`h-6 w-6 ${navScrolled ? "text-[#111827]" : "text-white"}`} />
            ) : (
              <Menu className={`h-6 w-6 ${navScrolled ? "text-[#111827]" : "text-white"}`} />
            )}
          </button>
        </div>

        {/* Slide-down menu (<1024px) */}
        <div
          className="overflow-hidden transition-all duration-300 ease-out lg:hidden"
          style={{ maxHeight: menuOpen ? "400px" : "0", opacity: menuOpen ? 1 : 0 }}
        >
          <nav
            className={`border-t px-4 py-4 ${navScrolled ? "border-[#E5E7EB] bg-white/95" : "border-white/20 bg-slate-900/95"}`}
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) =>
                link.href.startsWith("/") ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={closeMenu}
                    className={`min-h-[48px] flex items-center rounded-lg px-4 text-sm font-medium transition-colors ${navScrolled ? "text-[#6B7280] hover:bg-slate-100 hover:text-[#111827]" : "text-white/90 hover:bg-white/10"}`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={closeMenu}
                    className={`min-h-[48px] flex items-center rounded-lg px-4 text-sm font-medium transition-colors ${navScrolled ? "text-[#6B7280] hover:bg-slate-100 hover:text-[#111827]" : "text-white/90 hover:bg-white/10"}`}
                  >
                    {link.label}
                  </a>
                )
              )}
              <div className="mt-2 flex flex-col gap-2 border-t pt-3" style={{ borderColor: navScrolled ? "#E5E7EB" : "rgba(255,255,255,0.2)" }}>
                <Link
                  to="/investor/login"
                  onClick={closeMenu}
                  className="min-h-[48px] flex items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors border"
                  style={navScrolled ? { borderColor: "#E5E7EB", color: "#111827" } : { borderColor: "rgba(255,255,255,0.4)", color: "white" }}
                >
                  Login
                </Link>
                <Link
                  to="/investor/login"
                  onClick={closeMenu}
                  className="min-h-[48px] flex items-center justify-center rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* --------------------------------------------
          HERO – full viewport, video bg, overlay, left content
      -------------------------------------------- */}
      <section className="relative flex min-h-[70dvh] items-center overflow-hidden py-12 sm:min-h-[85dvh] sm:py-16 md:min-h-[100dvh] lg:py-24">
        {/* Video background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover object-center"
            poster="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop"
          >
            <source src={HERO_VIDEO_SRC} type="video/mp4" />
          </video>
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-center gap-8 px-4 pt-20 pb-8 sm:gap-10 sm:px-6 sm:pt-24 md:pb-0 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pt-0">
          {/* Left: copy + CTAs */}
          <div className="min-w-0 w-full">
            <motion.div
              variants={stagger(0.08)}
              initial="hidden"
              animate="visible"
              className="flex w-full flex-col"
            >
              <motion.div
                variants={fadeUp}
                className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                LIVE IN 12 MARKETS
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="w-full break-words text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
              >
                Invest in Premium Real Estate,{" "}
                <span className="text-[#60a5fa]">One Brick</span> at a Time
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-4 w-full max-w-xl text-base text-slate-300 sm:mt-6 sm:text-lg md:text-xl"
              >
                Fractional ownership in institutional-grade properties. Start with as
                little as ₹500, earn rental income and appreciation, and trade shares
                on a secure platform—no large capital or paperwork.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
                <Link
                  to="/investor/login"
                  className="group relative inline-flex min-h-[48px] w-full items-center justify-center overflow-hidden rounded-xl bg-[#2563eb] px-6 py-3 text-base font-semibold text-white shadow-xl shadow-blue-600/30 transition-all duration-300 hover:scale-[1.02] hover:bg-[#1d4ed8] hover:shadow-blue-600/40 sm:w-auto sm:flex-none sm:px-8"
                >
                  <span className="relative z-10">Start Investing</span>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-white/40 bg-white/5 px-5 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-white/60 hover:bg-white/10 sm:w-auto sm:flex-none sm:px-6"
                >
                  <Play className="h-5 w-5 shrink-0" />
                  <span className="truncate">Watch Demo</span>
                </a>
              </motion.div>

              {/* Trust: avatars + count */}
              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-12 sm:justify-start sm:gap-4"
              >
                <div className="flex shrink-0 -space-x-3">
                  {AVATAR_URLS.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="h-9 w-9 rounded-full border-2 border-slate-800 object-cover shadow-lg sm:h-10 sm:w-10"
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-400">
                  Joined by <span className="font-semibold text-white">12,000+</span>{" "}
                  active investors
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Right: floating featured property card (stacked below on mobile/tablet, side-by-side on desktop) */}
          <div className="w-full min-w-0 max-w-full lg:max-w-none">
            <div className="mx-auto w-full max-w-full lg:mx-0 lg:max-w-sm">
              <FloatingPropertyCard />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------
          EXPLORE PROPERTIES (anchor for #properties)
      -------------------------------------------- */}
      <section id="properties" className="bg-slate-800/30 py-12 sm:py-16 md:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 text-center md:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="break-words text-2xl font-bold text-white sm:text-3xl md:text-4xl"
          >
            Explore Verified Properties
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-3 text-slate-400"
          >
            Browse commercial and residential assets in 12 markets.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <Link
              to="/investor/login"
              className="inline-flex min-h-[48px] min-w-[160px] items-center justify-center rounded-xl border border-white/30 bg-white/5 px-6 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              View All Properties
            </Link>
          </motion.div>
        </div>
      </section>

      {/* --------------------------------------------
          MEDIA / LOGO STRIP
      -------------------------------------------- */}
      <section className="border-y border-slate-800/80 bg-slate-900/50 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-6 px-4 md:gap-10 md:px-6 lg:gap-16"
        >
          {MEDIA_LOGOS.map((name) => (
            <span
              key={name}
              className="text-lg font-semibold text-slate-500/80 md:text-xl"
            >
              {name}
            </span>
          ))}
        </motion.div>
      </section>

      {/* --------------------------------------------
          HOW SMARTBRICK WORKS – 3 steps, scroll fade-up
      -------------------------------------------- */}
      <section id="how-it-works" className="bg-[#F8FAFC] py-16 sm:py-24 md:py-32">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center"
          >
            <h2 className="break-words text-2xl font-bold text-[#111827] sm:text-3xl md:text-4xl lg:text-5xl">
              How SmartBrick Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[#6B7280] sm:text-lg">
              Three simple steps to start earning from premium real estate.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-6 sm:mt-16 sm:gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <StepCardFixed key={step.title} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------
          WHY SMARTBRICK – dark, premium trust cards
      -------------------------------------------- */}
      <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-slate-900" />
        <div className="relative mx-auto w-full max-w-6xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="break-words text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl">
              Why SmartBrick
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
              Built for trust, transparency, and long-term returns.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:mt-16 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_ITEMS.map((item, i) => (
              <WhyCard key={item.title} item={item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------
          CTA + Footer (minimal)
      -------------------------------------------- */}
      <section className="bg-[#111827] py-14 sm:py-20">
        <div className="mx-auto w-full max-w-4xl px-4 text-center md:px-6">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="break-words text-2xl font-bold text-white sm:text-3xl md:text-4xl"
          >
            Ready to start investing in real estate?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-4 text-base text-slate-400 sm:text-lg"
          >
            Join 12,000+ investors on SmartBrick. Free to sign up.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <Link
              to="/investor/login"
              className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-xl bg-[#2563eb] px-6 py-3 text-base font-semibold text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] hover:bg-[#1d4ed8] sm:px-8"
            >
              Create Free Account
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-900 py-8 sm:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:px-6 md:text-left">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb]">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white">SmartBrick</span>
          </Link>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} SmartBrick. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// --------------------------------------------
// Floating property card (glassmorphism, float anim)
// --------------------------------------------
function FloatingPropertyCard() {
  return (
    <motion.div
      className="relative w-full max-w-full min-w-0 md:max-w-sm"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <motion.div
        className="min-w-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-[1px] shadow-2xl backdrop-blur-xl"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.03, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)" }}
      >
        <div className="rounded-2xl bg-slate-900/60 p-4 backdrop-blur-md">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-700">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop"
              alt="Featured property"
              className="h-full w-full object-cover"
            />
            <div className="absolute left-2 top-2 rounded-lg bg-[#2563eb] px-2 py-1 text-xs font-semibold text-white">
              FEATURED
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-bold text-white">Manhattan Heights</h3>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Commercial • NYC
            </p>
            <ul className="flex flex-wrap gap-3 text-sm text-slate-300">
              <li><span className="text-slate-500">Occupancy</span> 98%</li>
              <li><span className="text-slate-500">Target return</span> 12.4%</li>
              <li><span className="text-slate-500">Min.</span> ₹500</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --------------------------------------------
// Step card (How it Works) – scroll reveal, hover lift
// --------------------------------------------
function StepCardFixed({
  step,
  index,
}: {
  step: (typeof STEPS)[0];
  index: number;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6 }}
      className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-shadow hover:shadow-xl sm:p-8"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-white opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2563eb] text-white shadow-lg shadow-blue-600/20">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mt-6 break-words text-xl font-bold text-[#111827]">{step.title}</h3>
        <p className="mt-3 break-words text-[#6B7280]">{step.description}</p>
      </div>
    </motion.div>
  );
}

// Why card – dark glass, gradient border
function WhyCard({
  item,
  index,
}: {
  item: (typeof WHY_ITEMS)[0];
  index: number;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 sm:p-6"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#2563eb]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2563eb]/20 text-[#60a5fa]">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mt-4 break-words font-semibold text-white">{item.title}</h3>
        <p className="mt-2 break-words text-sm text-slate-400">{item.description}</p>
      </div>
    </motion.div>
  );
}
