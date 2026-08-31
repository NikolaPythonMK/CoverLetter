import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name: name || null, passwordHash, plan: "free" },
  });
  return NextResponse.json({ ok: true, id: user.id });
}

// rigstser a ne register
// imeto na folderot vo nextjs oznacuva pateka...

//da se sredi samo da bide poubavo flow i da se ovozmozi facebook google apple logiranje :d 
////2 toa e easy, da vidime so gpt kako ke raboti ako i toa ni raboti, zavrseni sme. drugoto se sitnici
// ajde ti prativ token i kod 2 sekundi rabota e da se proveri staj token i kod ili otvori api dokumentiacija na gpt
// od tatmu povicite
