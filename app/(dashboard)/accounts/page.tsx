import { redirect } from "next/navigation";

export const metadata = { title: "共享账号" };

export default function AccountsPage() {
  redirect("/slots");
}
