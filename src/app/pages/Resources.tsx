import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SiteHeader } from "../components/layout/SiteHeader";
import { SiteFooter } from "../components/layout/SiteFooter";
import {
  BookOpen,
  PieChart,
  TrendingUp,
  Building2,
  ChevronDown,
  FileText,
  Shield,
  Scale,
  Lock,
} from "lucide-react";

// --------------------------------------------
// Animation config
// --------------------------------------------
const sectionReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

const viewport = { once: true, margin: "-40px" };

const GUIDE_ITEMS = [
  {
    icon: BookOpen,
    title: "Real Estate Investing 101",
    desc: "Learn the basics of property investment, from understanding market cycles to evaluating opportunities and building a diversified portfolio.",
  },
  {
    icon: PieChart,
    title: "Fractional Ownership Explained",
    desc: "Discover how fractional ownership lets you invest in premium properties with lower capital, shared risk, and transparent returns.",
  },
  {
    icon: TrendingUp,
    title: "Risk & Returns",
    desc: "Understand the relationship between risk and expected returns in real estate, and how SmartBrick structures deals for long-term value.",
  },
  {
    icon: Building2,
    title: "Commercial vs Residential",
    desc: "Compare commercial and residential assets—rental yields, liquidity, and which may suit your investment goals.",
  },
];

const HOW_IT_WORKS_STEPS = [
  { step: 1, title: "Browse & Select", desc: "Explore verified properties and choose one that fits your goals and budget." },
  { step: 2, title: "Invest", desc: "Complete KYC, fund your account, and invest from as little as ₹500." },
  { step: 3, title: "Earn", desc: "Receive rental income and track appreciation through your dashboard." },
  { step: 4, title: "Exit", desc: "Sell your shares on the platform when you’re ready to exit." },
];

const MARKET_INSIGHTS = [
  { title: "Q4 2024 Market Outlook", summary: "Key trends in commercial and residential real estate across major markets." },
  { title: "Fractional Investment Performance", summary: "How fractional assets have performed vs traditional real estate." },
  { title: "Rental Yield Guide", summary: "Understanding occupancy, yields, and what to expect from different property types." },
];

const FAQ_ITEMS = [
  {
    q: "What is the minimum investment amount?",
    a: "You can start investing with as little as ₹500 on most properties. Some offerings may have higher minimums based on the asset.",
  },
  {
    q: "How do I receive returns?",
    a: "Rental income is distributed to investors according to their share of ownership, typically on a monthly or quarterly basis. You can track and withdraw from your dashboard.",
  },
  {
    q: "Is my investment liquid?",
    a: "SmartBrick provides a secondary market where you can list your shares for sale. Liquidity depends on demand; we do not guarantee instant exit.",
  },
  {
    q: "How is my data protected?",
    a: "We use bank-grade encryption, secure authentication, and comply with applicable data protection regulations. Your personal and financial data is never shared without your consent.",
  },
];

const LEGAL_LINKS = [
  { label: "Risk Disclosure", href: "#", icon: FileText },
  { label: "Privacy Policy", href: "#", icon: Lock },
  { label: "Terms of Service", href: "#", icon: Scale },
];

// --------------------------------------------
// Resources Page
// --------------------------------------------
export default function Resources() {
  const prefersReducedMotion = useReducedMotion();
  const noMotion = prefersReducedMotion ?? false;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const sectionInitial = noMotion ? { opacity: 1, y: 0 } : sectionReveal.hidden;
  const sectionAnimate = noMotion ? { opacity: 1, y: 0 } : sectionReveal.visible;
  const cardHover = noMotion ? {} : { y: -4 };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-sans antialiased">
      <SiteHeader />

      <main>
        {/* 1. Hero */}
        <section
          className="relative flex min-h-[40dvh] items-center overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 sm:min-h-[45dvh] md:min-h-[50dvh]"
          aria-label="Resources hero"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=60')] bg-cover bg-center opacity-30" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 to-slate-900/90" aria-hidden />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 md:py-24 md:text-left">
            <div className="mx-auto max-w-2xl md:mx-0">
              <motion.h1
                initial={noMotion ? false : { opacity: 0, y: 16 }}
                animate={noMotion ? false : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
              >
                Resources & Insights
              </motion.h1>
              <motion.p
                initial={noMotion ? false : { opacity: 0, y: 12 }}
                animate={noMotion ? false : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                className="mt-4 text-base text-slate-300 sm:text-lg"
              >
                Education and guidance to help you make informed real estate investment decisions.
              </motion.p>
            </div>
          </div>
        </section>

        {/* 2. Investment Guides */}
        <motion.section
          className="px-4 py-16 md:px-6 md:py-24"
          initial={sectionInitial}
          whileInView={sectionAnimate}
          viewport={viewport}
          transition={sectionReveal.transition}
        >
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "#111827" }}>
              Investment Guides
            </h2>
            <p className="mt-3 max-w-2xl text-base" style={{ color: "#6B7280" }}>
              Build your knowledge with clear, practical guides on real estate and fractional investing.
            </p>
            <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
              {GUIDE_ITEMS.map(({ icon: Icon, title, desc }, i) => (
                <motion.article
                  key={title}
                  initial={noMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={cardHover}
                  className="flex min-w-0 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: "#2563EB" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold" style={{ color: "#111827" }}>
                    {title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                    {desc}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 3. How SmartBrick Works */}
        <motion.section
          className="px-4 py-16 md:px-6 md:py-24"
          style={{ backgroundColor: "#F8FAFC" }}
          initial={sectionInitial}
          whileInView={sectionAnimate}
          viewport={viewport}
          transition={sectionReveal.transition}
        >
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "#111827" }}>
              How SmartBrick Works
            </h2>
            <p className="mt-3 max-w-2xl text-base" style={{ color: "#6B7280" }}>
              A simple 4-step process from browsing to earning.
            </p>
            <div className="mt-10 grid gap-8 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS_STEPS.map(({ step, title, desc }, i) => (
                <motion.div
                  key={step}
                  initial={noMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="min-w-0"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: "#2563EB" }}
                  >
                    {step}
                  </div>
                  <h3 className="mt-4 font-semibold" style={{ color: "#111827" }}>
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                    {desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 4. Market Insights */}
        <motion.section
          className="px-4 py-16 md:px-6 md:py-24"
          initial={sectionInitial}
          whileInView={sectionAnimate}
          viewport={viewport}
          transition={sectionReveal.transition}
        >
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "#111827" }}>
              Market Insights
            </h2>
            <p className="mt-3 max-w-2xl text-base" style={{ color: "#6B7280" }}>
              Reports and insights to stay informed.
            </p>
            <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {MARKET_INSIGHTS.map(({ title, summary }, i) => (
                <motion.article
                  key={title}
                  initial={noMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  whileHover={cardHover}
                  className="flex min-w-0 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                >
                  <h3 className="font-semibold" style={{ color: "#111827" }}>
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                    {summary}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 5. FAQs */}
        <motion.section
          className="px-4 py-16 md:px-6 md:py-24"
          style={{ backgroundColor: "#F8FAFC" }}
          initial={sectionInitial}
          whileInView={sectionAnimate}
          viewport={viewport}
          transition={sectionReveal.transition}
        >
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "#111827" }}>
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base" style={{ color: "#6B7280" }}>
              Investor-focused answers to common questions.
            </p>
            <div className="mt-10 space-y-3">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <motion.div
                  key={q}
                  initial={noMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80"
                    style={{ color: "#111827" }}
                    aria-expanded={openFaq === i}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                  >
                    <span className="font-medium">{q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                      style={{ color: "#6B7280" }}
                    />
                  </button>
                  <div
                    id={`faq-answer-${i}`}
                    role="region"
                    aria-labelledby={`faq-question-${i}`}
                    className="border-t border-[#E5E7EB] px-5 py-4"
                    style={{ display: openFaq === i ? "block" : "none" }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                      {a}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 6. Legal & Compliance */}
        <motion.section
          className="px-4 py-16 md:px-6 md:py-24"
          initial={sectionInitial}
          whileInView={sectionAnimate}
          viewport={viewport}
          transition={sectionReveal.transition}
        >
          <div className="mx-auto w-full max-w-6xl">
            <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "#111827" }}>
              Legal & Compliance
            </h2>
            <p className="mt-3 max-w-2xl text-base" style={{ color: "#6B7280" }}>
              Important documents for your reference.
            </p>
            <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {LEGAL_LINKS.map(({ label, href, icon: Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  initial={noMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  whileHover={cardHover}
                  className="flex min-w-0 items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "#EFF6FF", color: "#2563EB" }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: "#111827" }}>
                      {label}
                    </span>
                  </div>
                  <Shield className="ml-auto h-5 w-5 shrink-0 opacity-50" style={{ color: "#6B7280" }} />
                </motion.a>
              ))}
            </div>
          </div>
        </motion.section>
      </main>

      <SiteFooter />
    </div>
  );
}
