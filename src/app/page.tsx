import { redirect } from "next/navigation";

// 루트는 대시보드로 보낸다. (비로그인은 proxy.ts에서 /sign-in으로 먼저 리다이렉트됨)
export default function Home() {
  redirect("/dashboard");
}
