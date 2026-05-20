"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PERSONA_COOKIE, type Persona } from "@/lib/persona";

export async function setPersona(persona: Persona) {
  const store = await cookies();
  store.set(PERSONA_COOKIE, persona, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect("/");
}
