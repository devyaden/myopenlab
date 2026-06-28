import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-32 pb-20 md:pt-40 md:pb-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated May 11, 2025
            </p>

            <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none prose-headings:font-display prose-headings:font-semibold prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-signal hover:prose-a:text-signal-bright">
              <h2>1. Introduction</h2>
              <p>
                Welcome to Olab ("we," "our," or "us"). By accessing or using
                our website, applications, or services (collectively, the
                "Services"), you agree to be bound by these Terms of Service
                ("Terms"). Please read these Terms carefully.
              </p>

              <h2>2. Acceptance of Terms</h2>
              <p>
                By accessing or using our Services, you agree to be bound by
                these Terms and our Privacy Policy. If you do not agree to these
                Terms, you may not access or use our Services.
              </p>

              <h2>3. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will
                provide notice of any material changes by posting the updated
                Terms on our website or through other communications. Your
                continued use of the Services after such changes constitutes
                your acceptance of the new Terms.
              </p>

              <h2>4. Account Registration</h2>
              <p>
                To use certain features of our Services, you may need to
                register for an account. You agree to provide accurate, current,
                and complete information during the registration process and to
                update such information to keep it accurate, current, and
                complete.
              </p>
              <p>
                You are responsible for safeguarding your password and for all
                activities that occur under your account. You agree to notify us
                immediately of any unauthorized use of your account.
              </p>

              <h2>5. User Content</h2>
              <p>
                Our Services allow you to create, upload, store, and share
                content, including diagrams, documents, and other materials
                ("User Content"). You retain all rights to your User Content,
                but you grant us a worldwide, non-exclusive, royalty-free
                license to use, reproduce, modify, adapt, publish, translate,
                and distribute your User Content in connection with providing
                and improving our Services.
              </p>
              <p>
                You represent and warrant that you own or have the necessary
                rights to your User Content and that your User Content does not
                violate the rights of any third party or any applicable law.
              </p>

              <h2>6. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul>
                <li>
                  Use the Services in any way that violates any applicable law
                  or regulation
                </li>
                <li>
                  Infringe upon the rights of others or violate their privacy
                </li>
                <li>
                  Use the Services to transmit any malware, spyware, or other
                  harmful code
                </li>
                <li>
                  Interfere with or disrupt the Services or servers or networks
                  connected to the Services
                </li>
                <li>
                  Attempt to gain unauthorized access to any portion of the
                  Services
                </li>
                <li>
                  Use the Services for any illegal or unauthorized purpose
                </li>
                <li>
                  Engage in any data mining, scraping, or similar data gathering
                  activities
                </li>
              </ul>

              <h2>7. Intellectual Property</h2>
              <p>
                The Services and all content, features, and functionality
                thereof, including but not limited to all information, software,
                text, displays, images, video, and audio, and the design,
                selection, and arrangement thereof (excluding User Content), are
                owned by us, our licensors, or other providers and are protected
                by copyright, trademark, patent, and other intellectual property
                laws.
              </p>

              <h2>8. Subscription and Payments</h2>
              <p>
                Some of our Services require payment of fees. You agree to pay
                all fees in accordance with the fees, charges, and billing terms
                in effect at the time a fee is due and payable. You are
                responsible for paying all applicable taxes.
              </p>
              <p>
                Subscription fees are non-refundable except as required by law
                or as explicitly stated in these Terms. You may cancel your
                subscription at any time, but you will not receive a refund for
                any unused portion of your subscription.
              </p>

              <h2>9. Termination</h2>
              <p>
                We may terminate or suspend your access to all or part of the
                Services, with or without notice, for any conduct that we, in
                our sole discretion, believe violates these Terms or is harmful
                to other users of the Services, us, or third parties, or for any
                other reason.
              </p>

              <h2>10. Disclaimer of Warranties</h2>
              <p>
                THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING,
                BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>

              <h2>11. Limitation of Liability</h2>
              <p>
                IN NO EVENT WILL WE, OUR AFFILIATES, OR THEIR LICENSORS, SERVICE
                PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE
                FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF
                OR IN CONNECTION WITH YOUR USE OF THE SERVICES, INCLUDING ANY
                DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR
                PUNITIVE DAMAGES.
              </p>

              <h2>12. Governing Law</h2>
              <p>
                These Terms and any dispute arising out of or related to these
                Terms or the Services shall be governed by and construed in
                accordance with the laws of the state of [State], without giving
                effect to any choice or conflict of law provision or rule.
              </p>

              <h2>13. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <p>
                Email: legal@Olab.com
                <br />
                Address: 123 Innovation Street, Tech City, TC 12345
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="size-4" />
                  Back to home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
