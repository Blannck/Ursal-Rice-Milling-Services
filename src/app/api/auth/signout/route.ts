import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reason = searchParams.get("reason");

  // Clear all Stack Auth cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  allCookies.forEach((cookie) => {
    if (cookie.name.includes("stack") || cookie.name.includes("auth")) {
      cookieStore.delete({
        name: cookie.name,
        path: "/",
      });
    }
  });

  // Redirect to signin with reason
  const redirectUrl = reason
    ? `/signin?reason=${reason}`
    : "/signin";

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
