import { getBrevoClient } from "@/lib/brevo";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      emails,
      promo_code,
      listId,
      templateId,
      maxUses,
      remainingDaysInExpiry,
    } = body;

    if (!promo_code) {
      return NextResponse.json(
        { error: "Missing promo code parameter" },
        { status: 400 }
      );
    }

    // Check if we have either emails or listId
    if ((!emails || !emails.length) && !listId) {
      return NextResponse.json(
        { error: "Missing recipients: provide either emails or a list ID" },
        { status: 400 }
      );
    }

    // Initialize the Brevo client
    const brevoClient = await getBrevoClient();
    const transactionalEmailsApi = brevoClient.transactionalEmailsApi;

    // If we have a listId, we'll send to the entire list
    if (listId) {
      const contactsApi = brevoClient.contactsApi;

      // Collect all contacts with pagination
      let allContacts: any[] = [];
      let offset = 0;
      let limit = 50;
      let hasMoreContacts = true;

      while (hasMoreContacts) {
        const listResponse = await contactsApi.getContactsFromList(
          parseInt(listId),
          undefined,
          limit,
          offset
        );

        const contacts = listResponse.body.contacts || [];
        allContacts = [...allContacts, ...contacts];

        // Check if we've reached the end
        if (contacts.length < limit) {
          hasMoreContacts = false;
        } else {
          offset += limit;
        }
      }

      // Create message versions for each contact
      const messageVersions = allContacts.map((contact: any) => ({
        to: [{ email: contact.email }],
        params: {
          first_name: contact.attributes.FIRSTNAME,
          promo_code,
          max_uses: Number(maxUses),
          remaining_days: Number(remainingDaysInExpiry),
          COMPANY: contact.attributes.COMPANY,
        },
      }));

      const emailData = {
        sender: { email: "noreply@the-open-lab.com", name: "OLAB" },
        templateId: parseInt(templateId),

        messageVersions,
      };

      try {
        const result = await transactionalEmailsApi.sendTransacEmail(emailData);
        return NextResponse.json({
          message: `Emails sent successfully to ${allContacts.length} contacts in list`,
          result,
        });
      } catch (error) {
        console.error("Error sending emails to list:", error);
        return NextResponse.json(
          { error: "Failed to send emails to list" },
          { status: 500 }
        );
      }
    }
    // Otherwise, send to individual emails
    else {
      // Create message versions for each email
      const messageVersions = emails.map((email: string) => ({
        to: [{ email }],
        params: {
          first_name: email.split("@")[0],
          promo_code,
          max_uses: maxUses,
          remaining_days: remainingDaysInExpiry,
        },
      }));

      const emailData = {
        sender: { email: "noreply@the-open-lab.com", name: "OLAB" },
        templateId: parseInt(templateId),

        messageVersions,
      };

      try {
        const result = await transactionalEmailsApi.sendTransacEmail(emailData);
        return NextResponse.json({
          message: "Emails sent successfully",
          result,
        });
      } catch (error) {
        console.error("Error sending emails:", error);
        return NextResponse.json(
          { error: "Failed to send emails" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in send-promo-emails API:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
