"use client";

import { useState, useRef } from "react";
import { m } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePullIn } from "@/lib/scroll-animations";

const contactInfo = [
    { icon: Mail, label: "team@pinchclamp.ai", href: "mailto:team@pinchclamp.ai" },
    { icon: Phone, label: "+91 9611901656", href: "tel:+919611901656" },
    { icon: MapPin, label: "Bangalore, India", href: "#" },
];

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID!;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

/* ─── Floating Field ───────────────────────────────────────────────────────── */

function FloatingField({
    label,
    hint,
    isTextarea,
    ...props
}: {
    label: string;
    hint: string;
    isTextarea?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    const [focused, setFocused] = useState(false);
    const hasValue = Boolean(props.value);
    const showHintInLabel = focused || hasValue;

    const inputClasses =
        "w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-pinch-text transition-all placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:shadow-[0_0_0_1px_hsl(187_80%_48%/0.3)] focus:outline-none";

    return (
        <div>
            <label className={cn("mb-1.5 flex items-baseline text-xs font-medium transition-colors duration-200", focused ? "text-pinch-cyan" : "text-pinch-muted")}>
                <span>{label}</span>
                <span
                    className={cn(
                        "ml-1.5 inline-flex items-baseline gap-1.5 transition-all duration-300 whitespace-nowrap",
                        showHintInLabel ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                    )}
                >
                    <span className="text-pinch-cyan text-[8px] relative top-[-1px]">●</span>
                    <span className="text-pinch-muted/50 text-[10px] font-normal">{hint}</span>
                </span>
            </label>
            {isTextarea ? (
                <textarea
                    {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    onFocus={(e) => { setFocused(true); props.onFocus?.(e as never); }}
                    onBlur={(e) => { setFocused(false); props.onBlur?.(e as never); }}
                    placeholder={focused ? "" : hint}
                    className={cn(inputClasses, "resize-none")}
                    style={{ borderColor: 'var(--border-field)' }}
                />
            ) : (
                <input
                    {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                    onFocus={(e) => { setFocused(true); props.onFocus?.(e as never); }}
                    onBlur={(e) => { setFocused(false); props.onBlur?.(e as never); }}
                    placeholder={focused ? "" : hint}
                    className={inputClasses}
                    style={{ borderColor: 'var(--border-field)' }}
                />
            )}
        </div>
    );
}

export default function Contact() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sectionRef = useRef<HTMLElement>(null);
    const pullIn = usePullIn(sectionRef);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const emailjs = (await import("@emailjs/browser")).default;
            await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    user_email: formData.email,
                    company: formData.company || "Not specified",
                    message: formData.message,
                },
                { publicKey: EMAILJS_PUBLIC_KEY }
            );
            setSubmitted(true);
            setFormData({ firstName: "", lastName: "", email: "", company: "", message: "" });
            setTimeout(() => setSubmitted(false), 4000);
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : JSON.stringify(err);
            console.error("EmailJS error:", errMsg);
            setError("Failed to send message. Please try again.");
            setTimeout(() => setError(null), 4000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section ref={sectionRef} id="contact" className="relative z-[1] py-24">
            <m.div style={pullIn} className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Heading */}
                <div className="mb-14 text-center">
                    <h2 className="font-heading text-3xl font-bold text-pinch-text md:text-4xl">
                        Let&apos;s <span className="gradient-arc-full-text">Talk</span>
                    </h2>
                    <p className="mx-auto mt-3 max-w-lg text-pinch-muted">
                        Ready to bring AI into your workflow? Get in touch and we&apos;ll get back to you within 24 hours.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                    {/* Form — 3/5 width */}
                    <div
                        className="rounded-xl border border-transparent p-6 lg:p-8 lg:col-span-3"
                        style={{ background: 'var(--overlay-card)', boxShadow: 'var(--shadow-card)' }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {/* First Name — simple placeholder, disappears on focus */}
                                <div className="flex flex-col">
                                    <label className="order-first mb-1.5 block text-xs font-medium text-pinch-muted transition-colors duration-200 peer-focus:text-pinch-cyan">First Name</label>
                                    <input
                                        required
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Enter your first name..."
                                        className="peer w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-pinch-text transition-all placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:shadow-[0_0_0_1px_hsl(187_80%_48%/0.3)] focus:outline-none focus:placeholder:text-transparent"
                                        style={{ borderColor: 'var(--border-field)' }}
                                    />
                                </div>
                                {/* Last Name — simple placeholder, disappears on focus */}
                                <div className="flex flex-col">
                                    <label className="order-first mb-1.5 block text-xs font-medium text-pinch-muted transition-colors duration-200 peer-focus:text-pinch-cyan">Last Name</label>
                                    <input
                                        required
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Enter your last name..."
                                        className="peer w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-pinch-text transition-all placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:shadow-[0_0_0_1px_hsl(187_80%_48%/0.3)] focus:outline-none focus:placeholder:text-transparent"
                                        style={{ borderColor: 'var(--border-field)' }}
                                    />
                                </div>
                            </div>
                            {/* Email — animated floating placeholder */}
                            <FloatingField
                                label="Email"
                                hint="your.email@company.com"
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            {/* Company — simple placeholder, disappears on focus */}
                            <div className="flex flex-col">
                                <label className="order-first mb-1.5 block text-xs font-medium text-pinch-muted transition-colors duration-200 peer-focus:text-pinch-cyan">Company</label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="Your Company..."
                                    className="peer w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-pinch-text transition-all placeholder:text-pinch-muted/40 focus:border-pinch-cyan focus:shadow-[0_0_0_1px_hsl(187_80%_48%/0.3)] focus:outline-none focus:placeholder:text-transparent"
                                    style={{ borderColor: 'var(--border-field)' }}
                                />
                            </div>
                            {/* Message — animated floating placeholder */}
                            <FloatingField
                                label="Message"
                                hint="Tell us about your project..."
                                required
                                isTextarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={4}
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary w-full justify-center"
                            >
                                {isSubmitting ? "Sending..." : submitted ? "Sent ✓" : (
                                    <span className="inline-flex items-center gap-2">Send Message <Send className="h-4 w-4 shrink-0" /></span>
                                )}
                            </button>
                            {error && (
                                <p className="mt-2 text-center text-sm text-red-400">{error}</p>
                            )}
                        </form>
                    </div>

                    {/* Contact Info — 2/5 width, separate stacked cards */}
                    <div className="flex flex-col justify-center gap-4 lg:col-span-2">
                        {contactInfo.map((info, i) => {
                            const Icon = info.icon;
                            return (
                                <m.a
                                    key={info.label}
                                    href={info.href}
                                    className="group rounded-xl border border-transparent p-5 transition-colors duration-300 hover:border-pinch-cyan/20 flex items-center gap-4"
                                    style={{ background: 'var(--overlay-card)', boxShadow: 'var(--shadow-card)' }}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={{ duration: 0.35, delay: i * 0.1, ease: "easeOut" }}
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'var(--overlay-subtle)' }}>
                                        <Icon className="h-5 w-5 text-pinch-cyan" />
                                    </div>
                                    <span className="text-sm text-pinch-text group-hover:text-pinch-cyan transition-colors">
                                        {info.label}
                                    </span>
                                </m.a>
                            );
                        })}
                    </div>
                </div>
            </m.div>
        </section>
    );
}
