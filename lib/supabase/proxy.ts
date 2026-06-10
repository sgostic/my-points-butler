import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "./config";

/* Durable anonymous visitor id. `pb_vid` is HTTP-only (authoritative,
   read server-side by /api/track); `pb_vid_pub` mirrors it so the analytics
   client can echo it on beacon requests. ~2 year lifetime → returning-visitor
   analysis survives across sessions. */
const VISITOR_COOKIE = "pb_vid";
const VISITOR_COOKIE_PUBLIC = "pb_vid_pub";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // ~2 years
const VARIANT_COOKIE = "pb_variant";
const VARIANT_COOKIE_MAX_AGE = VISITOR_COOKIE_MAX_AGE;
const DEFAULT_VARIANT = "a";
const VARIANTS = new Set(["a", "b", "c", "d"]);

function asVariant(value: string | null | undefined) {
  const normalized = value?.toLowerCase();
  return normalized && VARIANTS.has(normalized) ? normalized : null;
}

function setVariantCookie(response: NextResponse, variant: string) {
  response.cookies.set(VARIANT_COOKIE, variant, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VARIANT_COOKIE_MAX_AGE,
  });
}

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

/** Ensure the visitor cookies exist on the response, minting a new id if absent. */
function ensureVisitorCookie(request: NextRequest, response: NextResponse) {
  if (request.cookies.get(VISITOR_COOKIE)) return;

  const visitorId = crypto.randomUUID();
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
  response.cookies.set(VISITOR_COOKIE_PUBLIC, visitorId, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
}

function applyStickyVariant(request: NextRequest, response: NextResponse) {
  if (request.nextUrl.pathname !== "/") return response;

  const storedVariant = asVariant(request.cookies.get(VARIANT_COOKIE)?.value);
  const requestedVariant = asVariant(request.nextUrl.searchParams.get("variant"));

  if (!storedVariant) {
    setVariantCookie(response, requestedVariant ?? DEFAULT_VARIANT);
    return response;
  }

  if (request.nextUrl.searchParams.has("variant")) {
    return response;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.searchParams.set("variant", storedVariant);

  const redirectResponse = NextResponse.redirect(redirectUrl);
  copyResponseCookies(response, redirectResponse);
  setVariantCookie(redirectResponse, storedVariant);
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const response = NextResponse.next({ request });
    ensureVisitorCookie(request, response);
    return applyStickyVariant(request, response);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();

  // Mint the visitor cookie after the auth refresh so it survives the
  // potential response re-creation inside setAll above.
  ensureVisitorCookie(request, supabaseResponse);

  return applyStickyVariant(request, supabaseResponse);
}
