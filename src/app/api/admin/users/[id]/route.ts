import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";
import { stackServerApp } from "@/lib/stack";


export async function GET(_req: Request, { params }: { params: { id: string } }) {
try {
await assertAdmin();
const { id } = params;


// Pull user list and find by id (works fine for small admin tables)
const users: any[] = await stackServerApp.listUsers();
const u = users.find((x) => x.id === id) ?? null;


const appUser = await prisma.appUser.findUnique({ where: { id } });
const orders = await prisma.order.findMany({
where: { userId: id },
orderBy: { createdAt: "desc" },
include: { items: { include: { product: true } } },
});


return NextResponse.json({
ok: true,
user: {
id,
primaryEmail: u?.primaryEmail ?? appUser?.email ?? null,
displayName: u?.displayName ?? appUser?.displayName ?? null,
signedUpAt: u?.signedUpAt ?? null,
lastActiveAt: u?.lastActiveAt ?? u?.lastActive ?? appUser?.lastActiveAt ?? null,
authMethod: u?.primaryAuthMethod ?? u?.auth?.provider ?? appUser?.authMethod ?? null,
},
app: appUser,
orders,
});
} catch (err: any) {
const code = err.status || 500;
return NextResponse.json({ ok: false, error: err.message }, { status: code });
}
}
