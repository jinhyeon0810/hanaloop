import { cookies } from "next/headers";

export type Persona = "operator" | "executive";

export const PERSONA_COOKIE = "hanaloop_persona";
export const DEFAULT_PERSONA: Persona = "executive";

export async function readPersona(): Promise<Persona> {
  const store = await cookies();
  const value = store.get(PERSONA_COOKIE)?.value;
  return value === "operator" || value === "executive"
    ? value
    : DEFAULT_PERSONA;
}
