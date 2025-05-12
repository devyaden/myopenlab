import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">
              Privacy Policy
            </h1>

            <div className="prose prose-invert max-w-none">
              <p className="text-yadn-foreground/70">
                Last Updated: May 11, 2025
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                1. Introduction
              </h2>
              <p>
                At Olab ("we," "our," or "us"), we respect your privacy and are
                committed to protecting your personal information. This Privacy
                Policy explains how we collect, use, disclose, and safeguard
                your information when you use our website, applications, or
                services (collectively, the "Services").
              </p>
              <p>
                Please read this Privacy Policy carefully. By accessing or using
                our Services, you acknowledge that you have read, understood,
                and agree to be bound by this Privacy Policy.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                2. Information We Collect
              </h2>
              <p>
                We may collect several types of information from and about users
                of our Services, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-yadn-foreground/70">
                <li>
                  <strong>Personal Information:</strong> This includes
                  information that can be used to identify you, such as your
                  name, email address, postal address, phone number, and billing
                  information.
                </li>
                <li>
                  <strong>User Content:</strong> Information and content that
                  you create, upload, or store using our Services, including
                  diagrams, documents, and other materials.
                </li>
                <li>
                  <strong>Usage Information:</strong> Information about how you
                  use our Services, including your browsing history, search
                  queries, and interaction with features.
                </li>
                <li>
                  <strong>Device Information:</strong> Information about the
                  device you use to access our Services, including hardware
                  model, operating system, unique device identifiers, and mobile
                  network information.
                </li>
                <li>
                  <strong>Location Information:</strong> Information about your
                  location, which can be precise or imprecise depending on the
                  settings you use.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                3. How We Collect Information
              </h2>
              <p>We collect information in several ways:</p>
              <ul className="list-disc pl-6 space-y-2 text-yadn-foreground/70">
                <li>
                  <strong>Directly from you:</strong> When you register for an
                  account, subscribe to our Services, fill out forms, or
                  communicate with us.
                </li>
                <li>
                  <strong>Automatically:</strong> When you use our Services, we
                  automatically collect certain information about your device
                  and usage patterns.
                </li>
                <li>
                  <strong>From third parties:</strong> We may receive
                  information about you from third parties, such as business
                  partners, analytics providers, and advertising networks.
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                4. How We Use Your Information
              </h2>
              <p>
                We may use the information we collect for various purposes,
                including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-yadn-foreground/70">
                <li>Providing, maintaining, and improving our Services</li>
                <li>Processing transactions and sending related information</li>
                <li>
                  Sending administrative messages, such as updates, security
                  alerts, and support messages
                </li>
                <li>Responding to your comments, questions, and requests</li>
                <li>
                  Personalizing your experience and delivering content tailored
                  to your interests
                </li>
                <li>
                  Monitoring and analyzing trends, usage, and activities in
                  connection with our Services
                </li>
                <li>
                  Detecting, preventing, and addressing technical issues, fraud,
                  or illegal activities
                </li>
                <li>
                  Carrying out any other purpose described to you at the time
                  the information was collected
                </li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                5. Sharing Your Information
              </h2>
              <p>
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-yadn-foreground/70">
                <li>
                  With service providers who perform services on our behalf
                </li>
                <li>
                  With business partners with whom we jointly offer products or
                  services
                </li>
                <li>
                  In connection with a merger, sale of company assets,
                  financing, or acquisition
                </li>
                <li>To comply with legal obligations or protect our rights</li>
                <li>With your consent or at your direction</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                6. Data Security
              </h2>
              <p>
                We implement reasonable security measures to protect your
                personal information from unauthorized access, disclosure,
                alteration, and destruction. However, no method of transmission
                over the Internet or electronic storage is 100% secure, and we
                cannot guarantee absolute security.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                7. Your Rights and Choices
              </h2>
              <p>
                Depending on your location, you may have certain rights
                regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-yadn-foreground/70">
                <li>
                  Accessing, correcting, or deleting your personal information
                </li>
                <li>
                  Objecting to or restricting certain processing of your
                  personal information
                </li>
                <li>Requesting portability of your personal information</li>
                <li>
                  Withdrawing consent where processing is based on consent
                </li>
              </ul>
              <p>
                To exercise these rights, please contact us using the
                information provided in the "Contact Us" section below.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                8. Children's Privacy
              </h2>
              <p>
                Our Services are not intended for children under the age of 13,
                and we do not knowingly collect personal information from
                children under 13. If we learn that we have collected personal
                information from a child under 13, we will take steps to delete
                that information as quickly as possible.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                9. Changes to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the "Last Updated" date. You are advised
                to review this Privacy Policy periodically for any changes.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">
                10. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at:
              </p>
              <p className="mt-2">
                Email: privacy@Olab.com
                <br />
                Address: 123 Innovation Street, Tech City, TC 12345
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              <Link
                href="/"
                className="px-6 py-2 bg-yadn-accent-green text-background rounded-md hover:bg-yadn-accent-green/90 transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
