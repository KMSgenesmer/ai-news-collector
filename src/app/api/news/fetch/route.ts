import { auth } from "@clerk/nextjs/server";
import { runFetch } from "@/lib/news/pipeline";

// 서버리스 타임아웃 여유 (플랫폼이 지원하는 경우)
export const maxDuration = 60;

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runFetch(userId);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "뉴스 가져오기에 실패했습니다." },
      { status: 500 },
    );
  }
}
