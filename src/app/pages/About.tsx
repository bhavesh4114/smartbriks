import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { SiteHeader } from "../components/layout/SiteHeader";
import { SiteFooter } from "../components/layout/SiteFooter";
import {
  Shield,
  Lock,
  BarChart3,
  Cpu,
  Target,
  Eye,
} from "lucide-react";

// --------------------------------------------
// Assets (high-quality, responsive-friendly)
// --------------------------------------------
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80";
const SECTION_IMAGE =
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80";

// --------------------------------------------
// Animation config (respects prefers-reduced-motion)
// --------------------------------------------
const pageLoad = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

const viewport = { once: true, margin: "-50px" };

// --------------------------------------------
// About Us Page
// --------------------------------------------
export default function About() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion ?? false;

  const initial = noMotion ? { opacity: 1, y: 0 } : pageLoad.hidden;
  const animate = noMotion ? { opacity: 1, y: 0 } : pageLoad.visible;
  const sectionInitial = noMotion ? { opacity: 1, y: 0 } : sectionReveal.hidden;
  const sectionAnimate = noMotion ? { opacity: 1, y: 0 } : sectionReveal.visible;
  const cardHover = noMotion ? {} : { y: -6 };
  const cardHoverScale = noMotion ? {} : { scale: 1.02 };
  const iconHover = noMotion ? {} : { scale: 1.05 };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-sans antialiased">
      <SiteHeader />

      <motion.main
        initial={initial}
        animate={animate}
        transition={pageLoad.transition}
      >
        {/* 1. Hero – full-width image, overlay, staggered text, subtle image zoom */}
        <section className="relative flex min-h-[60dvh] items-center overflow-hidden sm:min-h-[70dvh] md:min-h-[80vh]">
          <motion.div
            className="absolute inset-0"
            initial={noMotion ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <img
              src={HERO_IMAGE}
              alt=""
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-slate-900/92 via-slate-900/75 to-slate-800/50"
              aria-hidden
            />
          </motion.div>

          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-20 text-left sm:px-6 md:py-24 md:text-left">
            <div className="max-w-2xl">
              <motion.h1
                initial={noMotion ? false : { opacity: 0, y: 18 }}
                animate={noMotion ? false : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl"
              >
                About SmartBrick
              </motion.h1>
              <motion.p
                initial={noMotion ? false : { opacity: 0, y: 16 }}
                animate={noMotion ? false : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.25 }}
                className="mt-4 text-lg text-slate-300 sm:text-xl"
              >
                We’re building a trusted, technology-driven platform for
                fractional real estate investment—so everyone can invest in
                property with transparency and security.
              </motion.p>
            </div>
          </div>
        </section>

        {/* 2. Our Story – image + text (desktop: side by side, mobile: stacked) */}
        <motion.section
          className="px-4 py-16 md:px-6 md:py-24"
          initial={sectionInitial}
          whileInView={sectionAnimate}
          viewport={viewport}
          transition={sectionReveal.transition}
        >
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid min-w-0 grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
              <motion.div
                className="relative aspect-[4/3] min-h-[240px] overflow-hidden rounded-2xl sm:aspect-[16/10]"
                initial={noMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
                whileInView={noMotion ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
                viewport={viewport}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <img
                  src={SECTION_IMAGE}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </motion.div>
              <div>
                <h2
                  className="text-2xl font-bold sm:text-3xl"
                  style={{ color: "#111827" }}
                >
                  Our Story
                </h2>
                <p
                  className="mt-4 text-base leading-relaxed sm:text-lg"
                  style={{ color: "#6B7280" }}
                >
                  SmartBrick is a real estate investment platform that combines
                  trust, transparency, and technology. We enable investors to
                  own a share of institutional-grade properties with low
                  minimums, clear reporting, and bank-grade security. Our goal is
                  to make real estate investing accessible without compromising
                  on diligence or compliance.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 3. Mission & Vision – Home-style cards (hover lift + shadow + gradient) */}
        <motion.section
          className="px-4 py-16 md:px-6 md:py-24"
          style={{ backgroundColor: "#F8FAFC" }}
          initial={sectionInitial}
          whileInView={sectionAnimate}
          viewport={viewport}
          transition={sectionReveal.transition}
        >
          <div className="mx-auto w-full max-w-5xl">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: "#111827" }}
            >
              Mission & Vision
            </h2>
            <div className="mt-10 grid gap-6 sm:mt-12 sm:gap-8 md:grid-cols-2">
              <motion.div
                initial={noMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.45, delay: 0.05 }}
                whileHover={cardHover}
                className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-shadow hover:shadow-xl sm:p-8"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg shadow-blue-600/20"
                    style={{ backgroundColor: "#2563EB", color: "#FFFFFF" }}
                    whileHover={iconHover}
                    transition={{ duration: 0.2 }}
                  >
                    <Target className="h-6 w-6" />
                  </motion.div>
                  <h3
                    className="mt-4 text-xl font-semibold"
                    style={{ color: "#111827" }}
                  >
                    Mission
                  </h3>
                  <p
                    className="mt-3 text-base leading-relaxed"
                    style={{ color: "#6B7280" }}
                  >
                    To make premium real estate investing accessible to everyone
                    through fractional ownership, clear terms, and
                    institutional standards—so you can build wealth with
                    confidence.
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={noMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport}
                transition={{ duration: 0.45, delay: 0.1 }}
                whileHover={cardHover}
                className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-shadow hover:shadow-xl sm:p-8"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-xl shadow-lg shadow-blue-600/20"
                    style={{ backgroundColor: "#2563EB", color: "#FFFFFF" }}
                    whileHover={iconHover}
                    transition={{ duration: 0.2 }}
                  >
                    <Eye className="h-6 w-6" />
                  </motion.div>
                  <h3
                    className="mt-4 text-xl font-semibold"
                    style={{ color: "#111827" }}
                  >
                    Vision
                  </h3>
                  <p
                    className="mt-3 text-base leading-relaxed"
                    style={{ color: "#6B7280" }}
                  >
                    To become the most trusted and transparent real estate
                    investment platform, where technology and compliance work
                    together to deliver long-term value for investors and
                    communities.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* 4. Why SmartBrick – grid cards, same style as Home step cards */}
        <motion.section
          className="px-4 py-16 md:px-6 md:py-24"
          initial={sectionInitial}
          whileInView={sectionAnimate}
          viewport={viewport}
          transition={sectionReveal.transition}
        >
          <div className="mx-auto w-full max-w-5xl">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: "#111827" }}
            >
              Why SmartBrick
            </h2>
            <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  Icon: Shield,
                  title: "Fractional Ownership",
                  desc: "Invest from as low as ₹500 in verified properties—no need for large capital or complex paperwork.",
                },
                {
                  Icon: Lock,
                  title: "Secure Investments",
                  desc: "Bank-grade security and regulated custody so your investments and data stay protected.",
                },
                {
                  Icon: BarChart3,
                  title: "Transparent Returns",
                  desc: "Real-time dashboards and clear reporting so you always know how your portfolio is performing.",
                },
                {
                  Icon: Cpu,
                  title: "Technology Driven",
                  desc: "Modern platform built for speed, clarity, and a smooth experience from onboarding to payouts.",
                },
              ].map(({ Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={noMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  whileHover={cardHover}
                  className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-shadow hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <motion.div
                      className="flex h-10 w-10 items-center justify-center rounded-lg shadow-lg shadow-blue-600/20"
                      style={{ backgroundColor: "#2563EB", color: "#FFFFFF" }}
                      whileHover={iconHover}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <h3
                      className="mt-4 font-semibold"
                      style={{ color: "#111827" }}
                    >
                      {title}
                    </h3>
                    <p
                      className="mt-2 text-sm leading-relaxed"
                      style={{ color: "#6B7280" }}
                    >
                      {desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 5. Trust & Security – image + content (desktop: side by side) */}
        <motion.section
          className="px-4 py-16 md:px-6 md:py-24"
          style={{ backgroundColor: "#F8FAFC" }}
          initial={sectionInitial}
          whileInView={sectionAnimate}
          viewport={viewport}
          transition={sectionReveal.transition}
        >
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid min-w-0 grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
              <div>
                <h2
                  className="text-2xl font-bold sm:text-3xl"
                  style={{ color: "#111827" }}
                >
                  Trust & Security
                </h2>
                <p
                  className="mt-4 text-base leading-relaxed sm:text-lg"
                  style={{ color: "#6B7280" }}
                >
                  We take data security and compliance seriously. Our systems
                  use industry-standard encryption, secure authentication, and
                  regulated custody where required. We are committed to
                  protecting your personal information and investment data, and
                  we work to align with best practices so you can focus on
                  investing with confidence.
                </p>
                <motion.div
                  className="mt-6 flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
                  whileHover={cardHoverScale}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <motion.span
                    className="inline-flex shrink-0"
                    whileHover={iconHover}
                    transition={{ duration: 0.2 }}
                  >
                    <Shield
                      className="h-6 w-6"
                      style={{ color: "#2563EB" }}
                    />
                  </motion.span>
                  <div>
                    <h3
                      className="font-semibold"
                      style={{ color: "#111827" }}
                    >
                      Your trust matters
                    </h3>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "#6B7280" }}
                    >
                      Every property is independently verified and
                      due-diligenced. We believe in transparency at every
                      step—from asset selection to reporting and payouts.
                    </p>
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="relative aspect-[4/3] min-h-[220px] overflow-hidden rounded-2xl sm:aspect-[16/10]"
                initial={noMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewport}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <img
                  src={HERO_IMAGE}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </motion.section>
      </motion.main>

      <SiteFooter />
    </div>
  );
}
