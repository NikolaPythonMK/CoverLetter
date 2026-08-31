import { getServerSession } from "next-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ---- server action: delete a letter (scoped to the signed-in user)
async function deleteLetterAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // delete safely (enforce ownership)
  await prisma.letter.deleteMany({
    where: { id, userId: session.user.id as string },
  });

  // refresh dashboard list
  revalidatePath("/dashboard");
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="container-narrow py-16">
        <h1 className="text-2xl font-bold mb-3">Please sign in</h1>
        <Link href="/login"><Button>Go to login</Button></Link>
      </div>
    );
  }

  const letters = await prisma.letter.findMany({
    where: { userId: session.user.id as string },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="container-narrow py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Library</h1>
        <Link href="/generator"><Button>New letter</Button></Link>
      </div>

      {!letters.length && (
        <p className="text-muted-foreground">
          No letters yet. Generate your first one!
        </p>
      )}

      <div className="space-y-4">
        {letters.map((l: any) => (
          <div key={l.id} className="rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {l.title || l.jobTitle || "Cover letter"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(l.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex gap-2">
                {/* Export PDF now works by id */}
                <a href={`/api/export-pdf?id=${l.id}`} >
                  <Button variant="outline" className="rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:opacity-90 disabled:opacity-60">Download PDF</Button>
                </a>

                {/* Delete letter via server action */}
                <form action={deleteLetterAction}>
                  <input type="hidden" name="id" value={l.id} />
                  <Button variant="destructive" type="submit">
                    Delete
                  </Button>
                </form>
              </div>
            </div>

            <pre className="whitespace-pre-wrap text-sm mt-3">{l.content}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
