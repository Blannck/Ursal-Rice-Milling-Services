import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";


export async function POST(req: Request, { params }: { params: { id: string } }) {
try {
await assertAdmin();
const id = params.id;
const body = await req.json().catch(() => ({}));
const reason = body?.reason as string | undefined;


const found = await prisma.appUser.upsert({
where: { id },
create: { id },
update: {},
});


const isBlocked = !!found.blockedAt;


const updated = await prisma.appUser.update({
where: { id },
data: isBlocked
? { blockedAt: null, blockReason: null } // Unblock
: { blockedAt: new Date(), blockReason: reason ?? null, status: "DEACTIVATED" as any }, // Block + deactivate
});


return NextResponse.json({ ok: true, blocked: !!updated.blockedAt });
} catch (err: any) {
const code = err.status || 500;
return NextResponse.json({ ok: false, error: err.message }, { status: code });
}
}
