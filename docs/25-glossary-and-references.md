# Section 25: Glossary & Industry References

## 1. Compliance & GRC Terminology Glossary

- **Annex A**: The normative list of 93 information security controls published in ISO/IEC 27001:2022, categorized into Organizational, People, Physical, and Technological themes.
- **Attestation**: A formal written conclusion by an independent licensed CPA firm expressing an opinion on the fairness of the presentation of the description of an organization's system and the suitability of control design (e.g., SOC 2 report).
- **Audit Plan**: A formal document defining the scope, objectives, schedule, resources, and methodology for conducting an audit engagement.
- **Audit Trail**: An append-only, chronologically sequenced record of system activities and data mutations providing legally defensible documentary evidence of operational changes.
- **CAPA (Corrective and Preventive Action)**: A systematic approach to investigating, understanding, and correcting non-conformities to prevent their recurrence.
- **Certification Body (CB)**: An independent, accredited third-party organization authorized by national accreditation bodies (e.g., ANAB, UKAS) to audit and issue formal ISO certifications.
- **Compensating Control**: An alternative security control that provides equivalent or comparable protection when a primary control cannot be technically or operationally implemented.
- **Deficiency / Finding**: An observed failure or gap where an operational control fails to meet the formal criteria of an adopted standard.
- **Fieldwork**: The active testing phase of an audit where auditors conduct staff interviews, observe processes, inspect configurations, and gather evidence.
- **Inherent Risk**: The level of raw risk exposure that exists in the absence of any technical, administrative, or operational controls.
- **ISMS (Information Security Management System)**: A systematic approach to managing sensitive company information, comprising policies, procedures, and technical controls (governed by ISO/IEC 27001).
- **Likelihood**: The estimated probability or frequency with which a threat agent can successfully exploit a vulnerability ($1..5$ scale).
- **Non-Conformity**: The non-fulfillment of a specified requirement within an official standard.
- **Residual Risk**: The remaining level of risk exposure after security controls and risk treatments have been applied.
- **Risk Acceptance**: A formal management decision to acknowledge and retain a specific operational risk without implementing further mitigation.
- **Risk Treatment**: The formal process of selecting and implementing measures to modify risk: *Mitigate*, *Accept*, *Transfer*, or *Avoid*.
- **SOC 2 Type I**: An independent examination evaluating the suitability of the design of controls at a specific single point in time.
- **SOC 2 Type II**: An independent examination evaluating both the suitability of design and the operational effectiveness of controls over a specified minimum period (typically 6 to 12 months).
- **Trust Services Criteria (TSC)**: The evaluation criteria established by the AICPA Assurance Services Executive Committee (Security, Availability, Processing Integrity, Confidentiality, Privacy).

---

## 2. Cryptographic & Web Engineering Terminology

- **Defense-in-Depth**: A security architecture that employs layered defensive mechanisms so that if one layer fails, subsequent layers prevent compromise.
- **HMAC (Hash-Based Message Authentication Code)**: A specific type of message authentication code involving a cryptographic hash function (e.g., SHA-256) and a secret key, providing integrity and authenticity verification.
- **IDOR (Insecure Direct Object Reference)**: An access control vulnerability occurring when an application provides direct access to objects based on user-supplied input without proper authorization checks.
- **PKCE (Proof Key for Code Exchange)**: An extension to the OAuth 2.0 authorization code flow designed to prevent authorization code interception attacks.
- **PostScript Operator**: Low-level text and geometric rendering instructions (e.g., `BT`, `ET`, `Tf`, `Td`, `re`, `f`) specified by the Adobe PDF reference standard.
- **RBAC (Role-Based Access Control)**: An access control mechanism where authorization is determined by predefined organizational roles rather than individual identities.
- **SSR (Server-Side Rendering)**: Generating full HTML web pages on the server for each incoming HTTP request rather than rendering entirely within client-side JavaScript.
- **Timing Safe Equal**: Constant-time byte-by-byte buffer comparison designed to thwart timing side-channel attacks.

---

## 3. Authoritative References & Standards Citations

1. **International Organization for Standardization (ISO)**:
   - *ISO/IEC 27001:2022*: Information security, cybersecurity and privacy protection — Information security management systems — Requirements.
   - *ISO/IEC 27002:2022*: Information security, cybersecurity and privacy protection — Information security controls.
2. **National Institute of Standards and Technology (NIST)**:
   - *NIST Cybersecurity Framework (CSF) 2.0*: A tool for improving critical infrastructure cybersecurity, Gaithersburg, MD, 2024.
   - *NIST Special Publication 800-53, Revision 5*: Security and Privacy Controls for Information Systems and Organizations.
   - *NIST Special Publication 800-37, Revision 2*: Risk Management Framework for Information Systems and Organizations.
3. **American Institute of Certified Public Accountants (AICPA)**:
   - *AICPA Trust Services Criteria (TSP Section 100)*: 2017 Trust Services Criteria for Security, Availability, Processing Integrity, Confidentiality, and Privacy.
4. **Internet Engineering Task Force (IETF) RFCs**:
   - *RFC 2104*: HMAC: Keyed-Hashing for Message Authentication (Krawczyk, Bellare, Canetti).
   - *RFC 7519*: JSON Web Token (JWT) (Jones, Bradley, Sakimura).
   - *RFC 7636*: Proof Key for Code Exchange by OAuth Public Clients (Sakimura, Bradley, Agarwal).
5. **Web Standards & Next.js Core Engineering**:
   - *Adobe Portable Document Format (PDF) Specification, Version 1.4*: Adobe Systems Incorporated.
   - *Next.js 16 Documentation*: Server Components, Server Actions, Turbopack, and Edge Runtime Protocols, Vercel, 2025.
   - *React 19 Core Documentation*: Server Components, Action Transitions, and Hook Paradigms, Meta Platforms, 2025.
