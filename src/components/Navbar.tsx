"use server";

import { stackServerApp } from "@/lib/stack";
import MobileNavbar from "./MobileNavbar";
import DesktopNavbar from "./DesktopNavbar";

async function Navbar() {
  const user = await stackServerApp.getUser();
  const app = stackServerApp.urls;

  const isAdmin =
    user &&
    user.id === process.env.ADMIN_ID &&
    user.primaryEmail === process.env.ADMIN_EMAIL;

  const safeUser = user
    ? {
        id: user.id,
        displayName: user.displayName,
        primaryEmail: user.primaryEmail,
        profileImageUrl: user.profileImageUrl,
      }
    : null;

  const safeApp = {
    signIn: app.signIn,
    signOut: app.signOut,
  };

  return (
    <nav className="sticky top-6 w-full  bg-transparent z-50">
      <DesktopNavbar user={safeUser} app={safeApp} isAdmin={!!isAdmin} />
      <MobileNavbar user={safeUser} app={safeApp} isAdmin={!!isAdmin} />
    </nav>
  );
}

export default Navbar;
