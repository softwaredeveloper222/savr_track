import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { computeStatus, getDaysUntil, shouldSendReminders } from "@/lib/deadline-status";
import { sendNotification } from "@/lib/notifications";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.CRON_API_KEY || "savr-cron-key";

  if (apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Update deadline statuses
    const activeDeadlines = await prisma.deadline.findMany({
      where: {
        status: { in: ["active", "due_soon"] },
        verificationStatus: "verified",
      },
    });

    let statusUpdated = 0;
    for (const deadline of activeDeadlines) {
      const newStatus = computeStatus(deadline.expirationDate, deadline.status);
      if (newStatus !== deadline.status) {
        await prisma.deadline.update({
          where: { id: deadline.id },
          data: { status: newStatus },
        });
        statusUpdated++;
      }
    }

    // 2. Send due reminders
    const now = new Date();
    const reminders = await prisma.reminder.findMany({
      where: {
        sentAt: null,
        deadline: {
          verificationStatus: "verified",
          status: { in: ["active", "due_soon", "overdue"] },
        },
      },
      include: {
        deadline: {
          include: {
            owner: true,
            watchers: { include: { user: true } },
          },
        },
        user: true,
      },
    });

    let remindersSent = 0;

    for (const reminder of reminders) {
      const { deadline } = reminder;
      if (!shouldSendReminders(deadline.verificationStatus, deadline.status)) continue;

      const daysUntil = getDaysUntil(deadline.expirationDate);

      // Check if this reminder should fire now
      // daysBefore=0 means overdue, daysBefore=1 means 1 day before, etc.
      const shouldFire =
        (reminder.daysBefore === 0 && daysUntil < 0) ||
        (reminder.daysBefore > 0 && daysUntil <= reminder.daysBefore);

      if (!shouldFire) continue;

      // Get user's notification preferences
      const prefs = await prisma.notificationPreference.findUnique({
        where: { userId: reminder.userId },
      });

      const channels = {
        email: prefs?.emailEnabled ?? true,
        sms: prefs?.smsEnabled ?? false,
      };

      // Check if user wants this reminder interval
      const wantedDays = prefs?.reminderDays ?? [30, 14, 7, 3, 1, 0];
      if (!wantedDays.includes(reminder.daysBefore)) {
        // Skip this reminder but mark it so we don't check again
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { sentAt: now, sentVia: "skipped_by_preference" },
        });
        continue;
      }

      const payload = {
        to: reminder.user.email,
        recipientName: `${reminder.user.firstName} ${reminder.user.lastName}`,
        deadlineTitle: deadline.title,
        deadlineId: deadline.id,
        category: deadline.category,
        expirationDate: format(new Date(deadline.expirationDate), "MMMM d, yyyy"),
        daysUntil,
        type: daysUntil < 0 ? "overdue" as const : "reminder" as const,
      };

      const result = await sendNotification(payload, channels, reminder.user.phone);

      const sentVia = [
        result.email ? "email" : null,
        result.sms ? "sms" : null,
      ].filter(Boolean).join(",") || "attempted";

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { sentAt: now, sentVia },
      });

      remindersSent++;

      // Also notify watchers
      for (const watcher of deadline.watchers) {
        const watcherPrefs = await prisma.notificationPreference.findUnique({
          where: { userId: watcher.userId },
        });

        await sendNotification(
          { ...payload, to: watcher.user.email, recipientName: `${watcher.user.firstName} ${watcher.user.lastName}` },
          { email: watcherPrefs?.emailEnabled ?? true, sms: watcherPrefs?.smsEnabled ?? false },
          watcher.user.phone
        );
      }
    }

    // 3. Escalation: notify admins about items overdue beyond escalation threshold
    const overdueDeadlines = await prisma.deadline.findMany({
      where: {
        status: "overdue",
        verificationStatus: "verified",
      },
      include: {
        owner: true,
        company: { include: { users: true } },
      },
    });

    let escalationsSent = 0;

    for (const deadline of overdueDeadlines) {
      const daysOverdue = Math.abs(getDaysUntil(deadline.expirationDate));

      // Find admins in the company
      const admins = deadline.company.users.filter((u) => u.role === "admin" && u.id !== deadline.ownerId);

      for (const admin of admins) {
        const adminPrefs = await prisma.notificationPreference.findUnique({
          where: { userId: admin.id },
        });

        const escalationThreshold = adminPrefs?.escalationDays ?? 3;

        if (daysOverdue >= escalationThreshold) {
          // Check if we already escalated today
          const existingEscalation = await prisma.activityLog.findFirst({
            where: {
              deadlineId: deadline.id,
              action: "escalation_sent",
              createdAt: { gte: new Date(now.toDateString()) },
            },
          });

          if (!existingEscalation) {
            await sendNotification(
              {
                to: admin.email,
                recipientName: `${admin.firstName} ${admin.lastName}`,
                deadlineTitle: deadline.title,
                deadlineId: deadline.id,
                category: deadline.category,
                expirationDate: format(new Date(deadline.expirationDate), "MMMM d, yyyy"),
                daysUntil: -daysOverdue,
                type: "escalation",
                ownerName: `${deadline.owner.firstName} ${deadline.owner.lastName}`,
              },
              { email: adminPrefs?.emailEnabled ?? true, sms: adminPrefs?.smsEnabled ?? false },
              admin.phone
            );

            await prisma.activityLog.create({
              data: {
                action: "escalation_sent",
                details: `Escalated to ${admin.firstName} ${admin.lastName} (${daysOverdue} days overdue)`,
                deadlineId: deadline.id,
                userId: admin.id,
              },
            });

            escalationsSent++;
          }
        }
      }
    }

    return NextResponse.json({
      message: "Reminder check complete",
      statusUpdated,
      remindersSent,
      escalationsSent,
      totalChecked: activeDeadlines.length,
    });
  } catch (error) {
    console.error("Error checking reminders:", error);
    return NextResponse.json(
      { error: "An error occurred while checking reminders" },
      { status: 500 }
    );
  }
}
