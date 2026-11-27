import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROOT_DOMAIN, slugFromHost, storeUrl } from "@/lib/store-url";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

const PROTECTED = ["/dashboard", "/onboarding"];
const GUEST_ONLY = ["/connexion", "/inscription"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Sous-domaine d'une boutique (chez-awa.oneshop.com/panier) : la requête est servie par
 * app/boutique/chez-awa/panier, sans changer l'adresse affichée. Pas de session à rafraîchir :
 * les clients d'une boutique ne se connectent pas.
 *
 * Site principal : les anciens liens /boutique/chez-awa/... sont redirigés vers le sous-domaine.
 */
function routeStorefront(request: NextRequest) {
  if (!ROOT_DOMAIN) return null;
  const { pathname, search } = request.nextUrl;

  const slug = slugFromHost(request.headers.get("host"));
  if (slug) {
    const url = request.nextUrl.clone();
    url.pathname = `/boutique/${slug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  const old = /^\/boutique\/([a-z0-9-]+)(\/.*)?$/.exec(pathname);
  if (old) return NextResponse.redirect(storeUrl(old[1], (old[2] ?? "") + search), 308);

  return null;
}

/**
 * Rafraîchit la session Supabase à chaque requête et fait les redirections
 * « optimistes ». L'autorisation réelle est revérifiée côté serveur (lib/dal.ts)
 * et par les règles RLS de la base.
 */
export async function proxy(request: NextRequest) {
  const storefront = routeStorefront(request);
  if (storefront) return storefront;
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;

  if (!signedIn && matches(pathname, PROTECTED)) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    url.searchParams.set("suite", pathname);
    return redirectWithCookies(url, response);
  }

  if (signedIn && matches(pathname, GUEST_ONLY)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
