import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/admin";


export async function POST(_req: Request, { params }: { params: { id: string } }) {
try {
await assertAdmin();
const id = params.id;


const existing = await prisma.appUser.upsert({
where: { id },
create: { id },
update: {},
});


const nextStatus = existing.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE";


const updated = await prisma.appUser.update({
where: { id },
data: {
status: nextStatus as any,
deactivatedAt: nextStatus === "DEACTIVATED" ? new Date() : null,
},
});


return NextResponse.json({ ok: true, status: updated.status });
} catch (err: any) {
const code = err.status || 500;
return NextResponse.json({ ok: false, error: err.message }, { status: code });
}
}