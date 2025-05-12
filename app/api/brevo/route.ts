import { NextResponse } from "next/server";
import { getBrevoClient } from "@/lib/brevo";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get("resource");

    if (!resource) {
      return NextResponse.json(
        { error: "Missing resource parameter" },
        { status: 400 }
      );
    }

    const brevoClient = await getBrevoClient();

    switch (resource) {
      case "lists": {
        // Fetch contact lists from Brevo
        const contactsApi = brevoClient.contactsApi;
        const listsResponse = await contactsApi.getLists(20, 0);
        return NextResponse.json({ lists: listsResponse.body.lists || [] });
      }

      case "templates": {
        // Fetch email templates from Brevo
        const templatesApi = brevoClient.transactionalEmailsApi;
        const templatesResponse = await templatesApi.getSmtpTemplates(
          true,
          50,
          0
        );
        return NextResponse.json({
          templates: templatesResponse.body.templates || [],
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid resource type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in Brevo API:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Brevo" },
      { status: 500 }
    );
  }
}
