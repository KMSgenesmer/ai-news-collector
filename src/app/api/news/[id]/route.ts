import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { deleteArticle } from "@/db/queries";

const idSchema = z.coerce.number().int().positive();

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = idSchema.safeParse((await params).id);
  if (!parsed.success) {
    return Response.json({ error: "잘못된 기사 ID입니다." }, { status: 400 });
  }

  try {
    const deleted = await deleteArticle(parsed.data);
    if (!deleted) {
      return Response.json({ error: "기사를 찾을 수 없습니다." }, { status: 404 });
    }
    return Response.json({ deleted: true });
  } catch {
    return Response.json({ error: "기사 삭제에 실패했습니다." }, { status: 500 });
  }
}
