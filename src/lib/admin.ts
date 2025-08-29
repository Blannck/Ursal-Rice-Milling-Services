import { stackServerApp } from "@/lib/stack";


export async function assertAdmin() {
const user = await stackServerApp.getUser();
const adminId = process.env.ADMIN_ID;
const adminEmail = process.env.ADMIN_EMAIL;
const isAdmin = user && user.id === adminId && user.primaryEmail === adminEmail;
if (!isAdmin) {
throw Object.assign(new Error("Not authorized"), { status: 403 });
}
return user;
}