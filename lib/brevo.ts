"use server";

import * as SibApiV3Sdk from "@sendinblue/client";

/**
 * Creates and returns a configured Brevo API client
 */
export async function getBrevoClient() {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not defined in environment variables");
  }

  // Create API instances
  const contactsApi = new SibApiV3Sdk.ContactsApi();
  const emailCampaignsApi = new SibApiV3Sdk.EmailCampaignsApi();
  const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

  // Set API keys for each instance
  contactsApi.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, apiKey);
  emailCampaignsApi.setApiKey(
    SibApiV3Sdk.EmailCampaignsApiApiKeys.apiKey,
    apiKey
  );
  transactionalEmailsApi.setApiKey(
    SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
    apiKey
  );

  // Return an object with access to different Brevo APIs
  return {
    contactsApi,
    emailCampaignsApi,
    transactionalEmailsApi,
  };
}
