"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage(
      "The login interface is ready. Authentication will be connected in the next milestone.",
    );
  }

  const isRegister = mode === "register";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080807] px-4 py-10 text-[#F5F0E1]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, #8D7330, #F5D76E, #4DD0E1, #8B7CFF)",
        }}
      />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/[0.045] blur-[100px]" />

      <div className="relative w-full max-w-[430px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#F5D76E] to-[#A47B19] text-xl font-black text-[#080807]">
            T
          </span>

          <span>
            <span className="block text-xl font-bold tracking-[0.2em]">
              TRACE
            </span>
            <span className="mt-0.5 block text-xs text-[#95886A]">
              See your code execute.
            </span>
          </span>
        </Link>

        <div className="rounded-2xl border border-[#39311E] bg-gradient-to-b from-[#12110D] to-[#0B0B09] p-6 shadow-2xl shadow-black/40 sm:p-8">
          <div className="mb-7 text-center">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl border border-[#245561] bg-[#0D191D] text-xl text-[#4DD0E1]">
              {isRegister ? "+" : "↗"}
            </span>

            <h1 className="text-2xl font-semibold tracking-tight">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#95886A]">
              {isRegister
                ? "Start your journey into the logic behind every line."
                : "Pick up where your next chapter begins."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-[#302819] bg-[#080807] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
              className={`rounded-lg px-3 py-2.5 text-sm transition ${
                !isRegister
                  ? "bg-[#211B0D] text-[#F5D76E] shadow-sm"
                  : "text-[#95886A] hover:text-[#E8DEC4]"
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
              className={`rounded-lg px-3 py-2.5 text-sm transition ${
                isRegister
                  ? "bg-[#211B0D] text-[#F5D76E] shadow-sm"
                  : "text-[#95886A] hover:text-[#E8DEC4]"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-xs font-medium text-[#C7B995]"
                >
                  Display name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="What should we call you?"
                  className="w-full rounded-xl border border-[#39311E] bg-[#080807] px-4 py-3 text-sm text-[#F5F0E1] outline-none placeholder:text-[#625638] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-medium text-[#C7B995]"
              >
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#39311E] bg-[#080807] px-4 py-3 text-sm text-[#F5F0E1] outline-none placeholder:text-[#625638] focus:border-[#4DD0E1] focus:ring-1 focus:ring-[#4DD0E1]/15"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-medium text-[#C7B995]"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={8}
                required
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-[#39311E] bg-[#080807] px-4 py-3 text-sm text-[#F5F0E1] outline-none placeholder:text-[#625638] focus:border-[#4DD0E1] focus:ring-1 focus:ring-[#4DD0E1]/15"
              />
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F5D76E] to-[#D4AF37] px-4 py-3.5 text-sm font-bold text-[#080807] transition hover:brightness-110 active:scale-[0.99]"
            >
              {isRegister ? "Create account" : "Sign in"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          {message && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-[#245561] bg-[#0D191D] p-3 text-sm leading-6 text-[#A6EAF4]"
            >
              {message}
            </div>
          )}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#302819]" />
            <span className="text-[10px] uppercase tracking-widest text-[#625638]">
              Your next chapter
            </span>
            <div className="h-px flex-1 bg-[#302819]" />
          </div>

          <p className="text-center text-xs leading-6 text-[#81765A]">
            By continuing, you'll be able to keep track of your challenges,
            review your attempts and build your programming skills.
          </p>
        </div>

        <Link
          href="/workspace"
          className="mt-6 block text-center text-xs text-[#81765A] transition hover:text-[#77CFE0]"
        >
          Explore the workspace without signing in →
        </Link>
      </div>
    </main>
  );
}
2;
