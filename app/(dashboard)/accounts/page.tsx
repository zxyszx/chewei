import { redirect } from "next/navigation";

export const metadata = { title: "合租车位" };

export default function AccountsPage() {
  redirect("/slots");
}
