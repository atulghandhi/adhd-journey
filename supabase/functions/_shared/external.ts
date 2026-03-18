interface PushArgs {
  body: string;
  title: string;
  token: string;
  userId: string;
}

interface EmailArgs {
  html: string;
  subject: string;
  to: string;
  userId: string;
}

export async function sendPushNotification(args: PushArgs) {
  const serverKey = Deno.env.get("FCM_SERVER_KEY");

  if (!serverKey) {
    console.log(
      `[STUB] FCM not configured — skipping push send for user_id=${args.userId}`,
    );

    return {
      ok: true,
      stub: true,
    };
  }

  try {
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      body: JSON.stringify({
        notification: {
          body: args.body,
          title: args.title,
        },
        to: args.token,
      }),
      headers: {
        Authorization: `key=${serverKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const body = await response.text();

      console.error(
        `[FCM] Failed for user_id=${args.userId}: ${response.status} ${body}`,
      );

      return {
        ok: false,
        stub: false,
      };
    }

    return {
      ok: true,
      stub: false,
    };
  } catch (error) {
    console.error(
      `[FCM] Network failure for user_id=${args.userId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    return {
      ok: false,
      stub: false,
    };
  }
}

export async function sendEmailNotification(args: EmailArgs) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");

  if (!apiKey || !from) {
    console.log(
      `[STUB] Resend not configured — skipping email send for user_id=${args.userId}`,
    );

    return {
      ok: true,
      stub: true,
    };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      body: JSON.stringify({
        from,
        html: args.html,
        subject: args.subject,
        to: [args.to],
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const body = await response.text();

      console.error(
        `[Resend] Failed for user_id=${args.userId}: ${response.status} ${body}`,
      );

      return {
        ok: false,
        stub: false,
      };
    }

    return {
      ok: true,
      stub: false,
    };
  } catch (error) {
    console.error(
      `[Resend] Network failure for user_id=${args.userId}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    return {
      ok: false,
      stub: false,
    };
  }
}
