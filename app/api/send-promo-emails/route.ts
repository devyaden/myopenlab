import { getBrevoClient } from "@/lib/brevo";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      emails,
      promo_code,
      email_list_ids,
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

    // Check if we have either emails or email_list_ids
    if (
      (!emails || !emails.length) &&
      (!email_list_ids || !email_list_ids.length)
    ) {
      return NextResponse.json(
        { error: "Missing recipients: provide either emails or list IDs" },
        { status: 400 }
      );
    }

    // Initialize the Brevo client
    const brevoClient = await getBrevoClient();
    const transactionalEmailsApi = brevoClient.transactionalEmailsApi;

    // Initialize arrays to collect all recipients
    let allMessageVersions: any[] = [];

    // Process list IDs if provided
    if (email_list_ids && email_list_ids.length > 0) {
      const contactsApi = brevoClient.contactsApi;

      // Process each list
      for (const listId of email_list_ids) {
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
        const listMessageVersions = allContacts.map((contact: any) => ({
          to: [{ email: contact.email }],
          params: {
            first_name:
              contact.attributes?.FIRSTNAME || contact.email.split("@")[0],
            promo_code,
            max_uses: Number(maxUses),
            remaining_days: Number(remainingDaysInExpiry),
            COMPANY: contact.attributes?.COMPANY || "",
          },
        }));

        allMessageVersions = [...allMessageVersions, ...listMessageVersions];
      }
    }

    // Process individual emails if provided
    if (emails && emails.length > 0) {
      const emailMessageVersions = emails
        .filter((email: string) => email.trim() !== "")
        .map((email: string) => ({
          to: [{ email }],
          params: {
            first_name: email.split("@")[0],
            promo_code,
            max_uses: maxUses,
            remaining_days: remainingDaysInExpiry,
          },
        }));

      allMessageVersions = [...allMessageVersions, ...emailMessageVersions];
    }

    // Send emails to all recipients
    if (allMessageVersions.length > 0) {
      const emailData = {
        sender: { email: "noreply@the-open-lab.com", name: "OLAB" },
        templateId: parseInt(templateId),
        messageVersions: allMessageVersions,
      };

      try {
        const result = await transactionalEmailsApi.sendTransacEmail(emailData);
        return NextResponse.json({
          message: `Emails sent successfully to ${allMessageVersions.length} recipients`,
          result,
        });
      } catch (error) {
        console.error("Error sending emails:", error);
        return NextResponse.json(
          { error: "Failed to send emails" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "No valid recipients found" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in send-promo-emails API:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
