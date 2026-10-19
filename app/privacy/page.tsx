import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy policy · GlowReserve",
  description:
    "How GlowReserve handles your personal data: accounts, bookings, reviews, business verification, who receives it, how long we keep it and your rights.",
};

const CONTACT = "support@mmiri28.com";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main style={{ background: "var(--cream)", padding: "7rem 1.25rem 4rem" }}>
        <article style={{ maxWidth: "760px", margin: "0 auto", color: "var(--charcoal)", lineHeight: 1.7, fontSize: "1rem" }}>
          <p style={{ fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--gold-dark)", fontWeight: 700 }}>
            Privacy
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 700, lineHeight: 1.15, margin: "0.5rem 0 0.75rem" }}>
            Privacy policy
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>GlowReserve · Last updated 19 October 2026</p>

          <p style={{ marginTop: "1.5rem", fontSize: "1.08rem" }}>
            GlowReserve lets you find beauty businesses, book appointments and leave reviews, and lets businesses manage
            their bookings. This policy explains what personal data we handle, why, who receives it, how long we keep it
            and the rights you have. It follows the EU General Data Protection Regulation (GDPR), as applied in Austria,
            and Nigeria&apos;s Data Protection Act 2023 (NDPA).
          </p>

          <Box title="In short">
            <ul>
              <li>We use your details to run your account, your bookings and your reviews, and nothing else.</li>
              <li>When you book, the business you book with sees your name, phone, email and booking details.</li>
              <li>Business owners prove who they are with ID photos; those photos are deleted two months after we decide.</li>
              <li>We never sell your data or use it for advertising.</li>
              <li>
                Questions or requests about your data: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
              </li>
            </ul>
          </Box>

          <H2 id="who">1. Who is responsible</H2>
          <p>
            GlowReserve is an app of <strong>mmiri28</strong>, owned and managed by Charles Bernard Aghadi, Graz,
            Austria. Email: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. We have not appointed a data protection officer,
            as the law does not require one for an organisation of our size; please send any privacy question or request
            to that address.
          </p>

          <H2 id="what">2. What we collect and why</H2>

          <H3>Your account</H3>
          <p>
            Your email address and password (stored only in scrambled form by our sign-in provider), a username, and if
            you add them, your full name, phone number and profile picture. Your username cannot be changed later.
          </p>
          <Basis>
            To create and run your account (Art. 6(1)(b) GDPR; section 25(1)(b) NDPA). Codes we send to confirm your
            email or phone number protect your account (Art. 6(1)(f) GDPR; section 25(1)(f) NDPA).
          </Basis>

          <H3>Bookings</H3>
          <p>
            The business, service, staff member and time you choose, the booking status, any note you add, and the name,
            phone number and email address you give for the booking. We send booking messages by email and SMS (for
            example when a booking is requested, confirmed or declined) and show them in the app.
          </p>
          <Basis>To make and manage the booking you ask for (Art. 6(1)(b) GDPR; section 25(1)(b) NDPA).</Basis>

          <H3>Reviews</H3>
          <p>
            Your star rating and comment after a booking. Reviews are public, together with your name and profile
            picture (never your phone number), so other customers can choose a business.
          </p>
          <Basis>
            You choose to publish a review; we show it in our legitimate interest in honest reviews (Art. 6(1)(f) GDPR;
            section 25(1)(f) NDPA). You can ask us to remove your review at any time.
          </Basis>

          <H3>If you run a business on GlowReserve</H3>
          <p>
            Your business name, description, category, address, city, phone, email, logo, cover and portfolio pictures,
            services, prices, opening hours and staff. This information is public, because customers need it to find and
            book you. Please only add staff details your staff have agreed to.
          </p>
          <Basis>To list your business and manage bookings (Art. 6(1)(b) GDPR; section 25(1)(b) NDPA).</Basis>

          <H3>Business verification</H3>
          <p>
            Before a business is published, its owner proves who they are. We ask for a confirmed email and phone number,
            the type of ID document, photos of the document (front, and back where it has one), a selfie and a selfie
            holding the document. These photos are kept in a private storage area that only our admins can open, and only
            to make the decision. Two months after an admin verifies or rejects the request, the photos are deleted
            automatically. The decision, its date and who made it stay, so a verified business keeps its badge.
          </p>
          <Basis>
            To keep customers safe from fake businesses, which is in their and our legitimate interest, and as a step
            before you can list a business (Art. 6(1)(b) and (f) GDPR; section 25(1)(b) and (f) NDPA). We do not use
            these photos for automatic face recognition, and we do not use them for anything else.
          </Basis>

          <H3>Notifications</H3>
          <p>In-app notifications about your bookings, reviews and verification, stored with your account.</p>

          <H3>Using the website</H3>
          <p>
            Our host processes technical data such as your IP address, browser and the pages you open, to deliver the
            website and protect it against misuse (Art. 6(1)(f) GDPR; section 25(1)(f) NDPA). We use only the cookies
            needed to keep you signed in. Your light or dark setting is remembered in your own browser&apos;s storage and
            never sent to us. We do not use advertising or tracking cookies, we do not run analytics, and our fonts are
            stored with GlowReserve itself, so opening a page does not contact Google.
          </p>

          <H2 id="who-sees">3. Who sees your data</H2>
          <ul>
            <li>
              <strong>The business you book with</strong> sees your booking, your name and the contact details you gave,
              so it can serve you.
            </li>
            <li>
              <strong>Everyone</strong> can see business listings, including the business&apos;s own phone and email,
              and published reviews with the reviewer&apos;s name and picture.
            </li>
            <li>
              <strong>Your profile</strong>, including your phone number, is visible only to you, to our admins and to
              businesses you have booked with. Other users cannot see it.
            </li>
            <li>
              <strong>Our admins</strong> see what they need to run GlowReserve, including verification photos while a
              request is open.
            </li>
          </ul>
          <p>
            We share data with the service providers below, who process it on our behalf under a data processing
            agreement. We do not sell, rent or trade personal data, and we disclose it to authorities only where the law
            requires us to.
          </p>
          <Table
            rows={[
              ["Supabase, Inc.", "Database, sign-in and private file storage", "Standard contractual clauses"],
              ["Netlify, Inc. (USA)", "Hosts the website and runs scheduled tasks such as the verification clean-up", "EU–U.S. Data Privacy Framework"],
              ["Resend (USA)", "Sends booking and account emails", "EU–U.S. Data Privacy Framework"],
              ["Twilio Inc. (USA)", "Sends SMS messages and phone confirmation codes", "EU–U.S. Data Privacy Framework"],
            ]}
          />

          <H2 id="transfers">4. Transfers outside the EU and Nigeria</H2>
          <p>
            Some providers above are based in the United States. Netlify, Resend and Twilio are certified under the
            EU–U.S. Data Privacy Framework, which the European Commission recognises as adequate (Art. 45 GDPR); Supabase
            uses the European Commission&apos;s standard contractual clauses (Art. 46 GDPR). Our team works between
            Austria and Nigeria, so a team member may handle your request from either country, only as far as needed to
            run the service you use.
          </p>

          <H2 id="retention">5. How long we keep data</H2>
          <ul>
            <li>
              <strong>Account, profile and business listing:</strong> while your account exists. When you ask us to
              delete your account, we delete your profile and business listing.
            </li>
            <li>
              <strong>Bookings:</strong> while your account exists, so you and the business can see your history. A
              booking stays with the business after you delete your account, without your profile, where the business
              needs it for its own records.
            </li>
            <li>
              <strong>Reviews:</strong> until you or we remove them.
            </li>
            <li>
              <strong>Verification photos:</strong> deleted two months after an admin verifies or rejects the request.
              Photos for a request that is still waiting stay until it is decided.
            </li>
            <li>
              <strong>Technical logs:</strong> kept by our host for a limited time, for security.
            </li>
          </ul>
          <p>We review what we hold from time to time and delete what is no longer needed.</p>

          <H2 id="rights">6. Your rights</H2>
          <p>
            Under the GDPR and the NDPA you have the right to access your data, correct it, have it deleted, restrict how
            we use it, receive the data you gave us in a common format, and object to processing based on our legitimate
            interests. Where we rely on your consent, you can withdraw it at any time. You can change most of your profile
            yourself in the app; for anything else, email <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. We reply within one
            month and may ask you to confirm your identity first. Using your rights is free.
          </p>
          <p>We do not make decisions about you by automated means alone, and we do not build profiles of you.</p>

          <H2 id="complaints">7. Complaints</H2>
          <p>
            Please tell us first at <a href={`mailto:${CONTACT}`}>{CONTACT}</a> so we can put it right. You can also
            complain to the Austrian Data Protection Authority (
            <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer">www.dsb.gv.at</a>), the Nigeria
            Data Protection Commission (
            <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer">ndpc.gov.ng</a>) or the authority
            where you live in the EU.
          </p>

          <H2 id="security">8. Security</H2>
          <p>
            GlowReserve is served only over an encrypted connection. Access to data is limited by account rules in the
            database, verification photos are kept in a private storage area, and passwords are stored only in scrambled
            form. If a breach puts your data at risk, we will inform you and the authorities as the law requires.
          </p>

          <H2 id="children">9. Children</H2>
          <p>
            GlowReserve is meant for adults. We do not knowingly collect data from children; if you believe a child has
            given us personal data, please contact us and we will delete it.
          </p>

          <H2 id="changes">10. Changes to this policy</H2>
          <p>
            We update this policy when GlowReserve or the law changes. The date at the top shows the latest version. If a
            change significantly affects how we use data you have already given us, we will tell you in the app or by
            email.
          </p>

          <p style={{ marginTop: "2.5rem", color: "var(--muted)", fontSize: "0.95rem" }}>
            mmiri28&apos;s website has its own policy:{" "}
            <a href="https://mmiri28.com/privacy" target="_blank" rel="noopener noreferrer">mmiri28.com/privacy</a>
          </p>
        </article>
      </main>
      <Footer />
      <style>{`
        article a { color: var(--gold-dark); }
        article ul { padding-left: 1.2em; margin-top: 0.5rem; }
        article li + li { margin-top: 0.4rem; }
        article p + p { margin-top: 0.75rem; }
      `}</style>
    </>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, margin: "2.5rem 0 0.75rem" }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "1.5rem 0 0.35rem" }}>{children}</h3>;
}

function Basis({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ marginTop: "0.5rem", fontSize: "0.95rem", color: "var(--muted)" }}>
      <strong style={{ color: "var(--charcoal)" }}>Why and legal basis: </strong>
      {children}
    </p>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "1.75rem", padding: "1.25rem 1.4rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem" }}>
      <p style={{ fontWeight: 700, marginBottom: "0.25rem" }}>{title}</p>
      {children}
    </div>
  );
}

function Table({ rows }: { rows: [string, string, string][] }) {
  const cell = { textAlign: "left" as const, verticalAlign: "top" as const, padding: "0.6rem 0.75rem", borderBottom: "1px solid var(--border)" };
  return (
    <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem", minWidth: "520px" }}>
        <thead>
          <tr>
            {["Provider", "What they do for us", "Transfer safeguard"].map((h) => (
              <th key={h} style={{ ...cell, color: "var(--muted)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>{r.map((c, i) => <td key={i} style={cell}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
