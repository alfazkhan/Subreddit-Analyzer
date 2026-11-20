# Privacy Policy

**Effective Date:** November 20, 2026  
**Last Updated:** November 20, 2026

---

## 1. Data Controller & Contact Information

This website and research platform (Subreddit Analyzer) is operated as an open-source, non-commercial academic research initiative supporting a Master's Thesis.

- **Data Controller:** Alfaz Khan
- **Location:** Munich, Bavaria, Germany
- **Contact Email:** `khanalfaaz14@gmail.com`
- **Platform URL:** [https://subanalyzer.theonlyalfaz.com](https://subanalyzer.theonlyalfaz.com)
- **Academic Research Purpose:** Empirical scientific inquiry into municipal communication patterns, discourse dynamics, topic clustering, and sentiment trends across public regional communities.

For any questions, concerns, or requests regarding this Privacy Policy or the processing of personal data, please contact the Data Controller directly via email.

---

## 2. Public Reddit Data Collection & Academic Research (Art. 6(1)(f) & Art. 89 GDPR)

### 2.1 Scope of Collection
The Subreddit Analyzer collects and analyzes publicly accessible discussion submissions from selected municipal and regional subreddits (such as `r/berlin`, `r/munich`, `r/nyc`, `r/london`, `r/amsterdam`, `r/singapore`, `r/toronto`, and `r/losangeles`). 

Data is harvested using an intentional **7-day maturity delay**. This observation window allows discussion threads to stabilize, prevents scraping transient or rapidly removed content, and respects user moderation workflows.

### 2.2 Data Points Collected
To strictly adhere to data minimization principles (Art. 5(1)(c) GDPR), the platform collects only:

- **Reddit Post Identifier:** Alphanumeric submission ID (stripped of internal Reddit prefixes).
- **Creation Timestamp:** Standardized UTC submission date and time.
- **Submission Title:** Public verbatim submission title text.
- **Submission Selftext / Body:** Public verbatim submission body text.
- **Public Engagement Metrics:** Net karma score (upvotes minus downvotes), community upvote ratio, and comment count.

### 2.3 Data Points Explicitly Not Collected
The platform deliberately avoids scraping or storing personal identity markers:

- **Author Usernames & Handles:** Reddit account usernames and author handles are **never** harvested, stored, or indexed.
- **User Profiles & Biographies:** Author profile links, karma counts, account age, and personal avatars are completely excluded.
- **Internal Reddit Account IDs:** No internal platform account identifiers are queried or retained.
- **Private Communications:** Modmail, direct messages, and chat room communications are never accessed or scraped.
- **Comment Threads & Nested Replies:** Discussion comments and user reply hierarchies are never collected or stored.

### 2.4 Local and Offline Natural Language Processing (NLP)
All Natural Language Processing and computational linguistic pipelines operate 100% locally and offline on self-hosted infrastructure:

- **Multilingual Sentiment Analysis:** Executed locally using fine-tuned XLM-RoBERTa cross-lingual transformer models.
- **Zero-Shot Topic Classification:** Executed locally using mDeBERTa-v3 natural language inference models.
- **Named Entity Recognition (NER):** Executed locally using SpaCy language models.
- **Lemmatization and Tokenization:** Executed locally using the NLTK computational linguistics toolkit.

No post texts, titles, or extracted linguistic tokens are transmitted to third-party artificial intelligence APIs, external commercial models, or cloud processing vendors.

### 2.5 Indirect Identification & Named Entity Extraction
While author usernames are never collected, verbatim post titles and bodies may contain information or context that could indirectly identify individuals. In addition, Named Entity Recognition models locally identify entity types such as `PERSON`, `LOC`, and `ORG` for topic extraction. Certain post IDs or external URLs may also link back to public Reddit records.

### 2.6 Legal Basis for Processing
The processing of public Reddit posts is conducted under:

- **Legitimate Interest (Art. 6(1)(f) GDPR):** The pursuit of legitimate academic research into public digital discourse, computational linguistics, and urban communication dynamics.
- **Scientific and Statistical Research Safeguards (Art. 89 GDPR & § 27 BDSG):** Appropriate technical and organizational measures (author anonymization, self-hosted offline NLP, 7-day maturity filtering) guarantee strict data minimization.

### 2.7 Right to Erasure for Reddit Authors (Art. 17 GDPR)
Any Reddit user whose post content has been processed by this platform has the unconditional right to request the permanent removal of their submission from our database.

To request deletion:

1. **Email Request:** Send an email to `khanalfaaz14@gmail.com`.
2. **Provide Identifier:** Include the Reddit Post ID or the public Reddit URL of the submission.
3. **Validation & Erasure:** Upon receipt and validation, the submission and all associated analytical records will be permanently purged from the database without undue delay.

---

## 3. User Accounts & Authentication (Firebase Auth & PostgreSQL)

The public exploration views of the Subreddit Analyzer do not require user registration or login. Account creation and dashboard access are restricted to project maintainers and authorized administrative researchers.

### 3.1 Data Stored for Registered Accounts
When an administrator logs into the management portal, the following information is processed:

- **Email Address:** Administrator login identity.
- **Display Name:** Profile name assigned in Firebase Authentication.
- **Firebase Unique User Identifier (UID):** Unique cryptographic user identifier.
- **Assigned Role:** Role-Based Access Control tier (`Super Admin`, `Admin`, `Developer`, `Guest User`).
- **API Usage & Quota Counters:** Static API key metadata and request rate counters.

Authentication state is managed via Google Firebase Authentication. Account roles and operational quota counters are persisted in the backend PostgreSQL database.

### 3.2 Legal Basis

- **Performance of a Contract / Requested Service (Art. 6(1)(b) GDPR):** Processing is required to deliver requested authentication and role-based access controls for administrative users.
- **Strictly Necessary Storage (§ 25(2) no. 2 TDDDG):** Storing authentication session tokens is strictly required to provide the digital telemedia service explicitly requested by the user.

---

## 4. Hosting & Infrastructure Logs

### 4.1 Architecture & Content Delivery

- **Frontend Application:** Hosted on Google Firebase Hosting (Google Ireland Limited / Google LLC).
- **Backend API & Scraping Services:** Deployed on self-hosted infrastructure (`api.theonlyalfaz.com`), routed and secured through Cloudflare Inc.

### 4.2 Server & Security Logs
When you visit this website, Firebase Hosting and Cloudflare servers automatically and temporarily record standard technical server logs:

- **Visitor IP Address:** Truncated or anonymized where applicable.
- **Request Timestamp:** Date and time of server access in UTC.
- **HTTP Method & Path:** The requested resource URI and verb (e.g., `GET /summary`).
- **HTTP Status Code & Response Size:** Server response code and transmitted byte count.
- **User-Agent String:** Browser family, version, and operating system.
- **Referrer URL:** The referring webpage header, if transmitted by the client.

### 4.3 Purpose & Legal Basis
These technical logs are processed strictly for:

- **System Reliability:** Guaranteeing server stability, system performance, and operational integrity.
- **Abuse Mitigation:** Preventing and mitigating DDoS attacks, malicious automated scrapers, and vulnerability probing.
- **Security Investigations:** Investigating technical incidents and unauthorized system access attempts.

**Legal Basis:** Legitimate Interest (Art. 6(1)(f) GDPR). Server logs are automatically purged or rotated within short retention windows (typically 7 to 30 days) in accordance with standard infrastructure security protocols.

---

## 5. Web Analytics (Firebase Analytics / Google Analytics 4)

### 5.1 Analytics Scope
To understand visitor traffic patterns, aggregate user engagement, and platform stability, this website integrates Google Firebase Analytics (powered by Google Analytics 4). Analytics measurements collect:

- **Aggregated Page Views:** Anonymized navigation events and route transitions.
- **Approximate Geographic Region:** Country and municipal city level (IP addresses are masked and truncated by default in GA4).
- **Technical Device Telemetry:** Browser family, operating system version, and viewport resolution.

### 5.2 Disabled by Default (Prior Opt-In Consent)
In strict compliance with Art. 6(1)(a) GDPR and Section 25(1) TDDDG:

- **Zero Pre-Consent Tracking:** Google Firebase Analytics is **disabled by default** upon your arrival.
- **No Early Identifiers:** No analytics cookies, tracking identifiers, or local telemedia storage mechanisms are initialized prior to explicit opt-in consent.
- **Affirmative Opt-In:** Analytics scripts execute only if you affirmatively select "Accept Analytics" on the Consent Banner.
- **Equal Prominence:** If you select "Reject" or dismiss the banner, no analytics tracking will occur, and no analytics cookies will be stored.

### 5.3 International Data Transfers
Google LLC is based in the United States. Where personal data is transferred to the USA, such transfers occur pursuant to the EU-US Data Privacy Framework (DPF) and the European Commission Standard Contractual Clauses (SCCs), ensuring adequate data protection safeguards.

### 5.4 Withdrawing or Changing Consent
You may change your preferences or withdraw your consent at any time with future effect:

- **Footer Trigger:** Click the "Cookie Settings" button located in the persistent footer across any page of the website.
- **Policy Button:** Click the "Manage Analytics Preferences" button at the bottom of this Privacy Policy page.

When you switch your preference to "Reject", analytics tracking is immediately disabled, and analytics identifiers are deleted.

---

## 6. Data Retention & Deletion Periods

- **Scraped Reddit Posts:** Public submission records are retained for the duration of the academic thesis research project and subsequent portfolio verification, unless an author requests deletion under Art. 17 GDPR.
- **Administrative Accounts:** Account credentials and profile records are retained for the active lifecycle of the platform or until an administrator requests account deletion.
- **Infrastructure Logs:** Connection and security logs maintained by CDN and hosting providers are deleted or anonymized according to their standard security schedules (typically within 7 to 30 days).
- **Analytics Consent Preference:** Your consent choice (`accepted` or `rejected`) is stored in your browser's local storage until you clear your browser data or modify your preference.

---

## 7. Your Rights Under GDPR (Art. 15-22 GDPR)

Under the General Data Protection Regulation (GDPR), you possess comprehensive statutory rights regarding your personal data:

1. **Right of Access (Art. 15 GDPR):** You have the right to obtain confirmation as to whether personal data concerning you is being processed, and to receive a copy of that data.
2. **Right to Rectification (Art. 16 GDPR):** You have the right to request the correction of inaccurate personal data.
3. **Right to Erasure / "Right to be Forgotten" (Art. 17 GDPR):** You have the right to request the immediate erasure of your personal data where statutory grounds apply.
4. **Right to Restriction of Processing (Art. 18 GDPR):** You have the right to request the restriction of processing under certain legal conditions.
5. **Right to Data Portability (Art. 20 GDPR):** You have the right to receive your personal data in a structured, commonly used, and machine-readable format.
6. **Right to Object (Art. 21 GDPR):** You have the right to object at any time, on grounds relating to your particular situation, to the processing of personal data based on Art. 6(1)(f) GDPR.
7. **Right to Withdraw Consent (Art. 7(3) GDPR):** Where processing is based on consent (Art. 6(1)(a) GDPR or Section 25(1) TDDDG), you have the right to withdraw your consent at any time without affecting the lawfulness of processing based on consent before its withdrawal.
8. **Right to Lodge a Complaint with a Supervisory Authority (Art. 77 GDPR):** If you believe that the processing of your personal data infringes data protection legislation, you have the right to lodge a complaint with a supervisory authority. The competent supervisory authority for the controller's jurisdiction is:

   > **Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)**  
   > Promenade 18  
   > 91522 Ansbach, Germany  
   > **Telephone:** +49 (0) 981 180093-0  
   > **Email:** poststelle@lda.bayern.de  
   > **Website:** [https://www.lda.bayern.de](https://www.lda.bayern.de)

---

## 8. Open-Source Disclaimer & Third-Party Self-Hosting

The Subreddit Analyzer source code is published publicly on GitHub as open-source software for educational and scientific research purposes.

- **No Dataset Distribution:** The open-source code repository does not include, distribute, or publish raw scraped Reddit datasets or processed personal data.
- **Self-Hosting Responsibilities:** Any third party or individual who forks, clones, or deploys this software is solely and independently responsible for their own legal compliance, including adherence to the GDPR, national data protection laws, and Reddit's Terms of Service and Developer Terms.
- **Liability Limitation:** The project maintainer assumes no liability for external deployments or downstream data processing conducted by third parties.
