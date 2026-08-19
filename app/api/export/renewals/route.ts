import ExcelJS from "exceljs";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const payment: Record<string, string> = { WECHAT: "微信", ALIPAY: "支付宝", CARD: "信用卡", CASH: "现金", OTHER: "其他" };

export async function GET() {
  await requireUser();
  const records = await prisma.renewal.findMany({ include: { member: true, slot: { include: { platform: true } }, operator: true }, orderBy: { createdAt: "desc" } });
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "车位管理系统";
  const sheet = workbook.addWorksheet("续费记录", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "日期", key: "createdAt", width: 20 }, { header: "车友", key: "member", width: 18 }, { header: "平台", key: "platform", width: 16 },
    { header: "车位", key: "slot", width: 10 }, { header: "原到期时间", key: "old", width: 16 }, { header: "新到期时间", key: "next", width: 16 },
    { header: "金额", key: "amount", width: 12 }, { header: "支付方式", key: "payment", width: 14 }, { header: "操作人", key: "operator", width: 14 }, { header: "备注", key: "note", width: 28 },
  ];
  for (const row of records) sheet.addRow({ createdAt: row.createdAt, member: row.member.nickname, platform: row.slot.platform.name, slot: `#${row.slot.slotNumber}`, old: row.oldExpireDate, next: row.newExpireDate, amount: Number(row.amount), payment: payment[row.paymentMethod], operator: row.operator.username, note: row.note || "" });
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  sheet.getColumn("amount").numFmt = "¥#,##0.00";
  sheet.autoFilter = { from: "A1", to: "J1" };
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="renewals-${new Date().toISOString().slice(0, 10)}.xlsx"` } });
}
