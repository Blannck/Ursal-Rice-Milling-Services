import { Hero7 } from "@/components/Hero";
import HomePage from "@/components/HomePage";
import { stackServerApp } from "@/lib/stack";
import { requireActiveUser } from "@/lib/guard";
import { redirect } from "next/navigation";

export default async function Home() {
  // Check if user is logged in and blocked/deactivated
  const user = await stackServerApp.getUser();
  if (user) {
    const check = await requireActiveUser();
    if ('redirect' in check && check.redirect) {
      redirect(check.redirect);
    }
  }

  return (
    <>
     
      <HomePage />
      
    </>
  );
}
