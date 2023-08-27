export const runtime = "edge"

const privacyPolicyContent = `We are committed to protecting the privacy and security of our users' information. This privacy policy explains how we collect, use, disclose, and protect personal information when you interact with our platform ("Understand", "platform", "service", "we", "us", or "our"). By using Understand, you agree to the terms of this privacy policy.

Note that our service is designed for students, educators, and educational institutions, and as such, we adhere to applicable federal student privacy laws, including the Family Educational Rights and Privacy Act (FERPA) and the Children's Online Privacy Protection Act (COPPA).

1. Information we collect

We collect only the minimum amount of information necessary to provide and maintain our service. The following are the categories of information we collect:

a. Personal information: When you create an account with Understand, we collect your name, email address, and profile photo, all of which are obtained through Google sign-in. If you select your educational institution, we will also collect identifying information about this educational institution. We also collect which classes you join within Understand.

b. User-generated content: We collect user-generated content of the following categories:

i. AI interactions: When we provide AI feedback on your work, we collect the contents of your work and the AI feedback. When you respond to the AI feedback, we collect your responses and the AI responses. When you make revisions to your work, we collect the contents of the revisions you make. We also collect whether you have chosen to make your feedback accessible to other students via a link. When you interact with our chat AI, we collect the contents of your messages and the AI responses.

ii. Class information: When you create a class through Understand, we collect the data you provide about it, including its name and section, along with the email addresses of the teachers and students you add to it.

iii. Assignment information: When you create an assignment through Understand, we collect the data you provide about it, including its title, description, associated class, and instructions.

For all user-generated content we collect, we also collect the date and time at which it is collected.

d. Google Classroom information: When you create a class through Understand, we provide the option to "link" it to a class in Google Classroom. This will significantly streamline the management of your class in Understand but requires extra access to your Google account. We will need to request access to which Google Classroom classes you are in, your Google Classroom rosters and the email addresses of those on these rosters, your Google Classroom assignments and materials, students' submissions on Google Classroom assignments, and the contents of Google Drive files within your Google Classroom classes. When you select a Google Classroom class to link an Understand class with, all information necessary to create the Understand class will be populated, and the following functionalities will be enabled within that class:

i. Roster sync: The Understand class roster will reflect changes made to the "linked" Google Classroom class roster.

ii: Assignment sync: The Understand class will import existing and newly created assignments from the linked Google Classroom class, including their title, description, and instructions. Understand may search through attachments on assignments and materials in order to find an assignment's instructions.

iii: Material sync: Understand's chat AI will be able to reference and explain materials from the linked Google Classroom class. This will require that we collect the contents of the materials within the linked Google Classroom class.

iv: Student work import: Students will be able to import work into Understand from the linked Google Classroom class Google Drive.

2. How we use your information

We use the information we collect to:

a. Provide and maintain our service, including personalizing our user experience. b. Support user accounts, authenticate users, and manage access control. c. Ensure the security of our service, detect and prevent fraud, and enforce our terms of service. d. Comply with legal obligations and respond to lawful requests from authorities.

3. Information sharing and disclosure

We do not sell any of your information to third parties. We may share your information in the following circumstances:

a. Service providers: We may share your information with third-party service providers that help us operate and maintain our service, such as hosting providers and artificial intelligence services. These providers are required to protect your information and use it only for the purposes for which it was disclosed.

b. Legal compliance: We may disclose your information if required by law, such as in response to a subpoena, court order, or government request.

4. Data retention and deletion

We retain your personal information only for as long as necessary to fulfill its intended educational purpose. You may request the deletion of your account and personal information by contacting us at support@understand.school. Students, parents, or guardians may request the deletion of their child's personal information by contacting the student's educational institution or us directly.

5. Security

We employ industry-standard security measures to protect your personal information, including encryption at rest and encryption during transmission. We regularly review and update our security practices to address evolving threats and vulnerabilities.

6. Access and control

Parents or guardians have the right to review their child's personal information collected by our service, correct any inaccuracies, and request the deletion of information that violates privacy laws. To exercise these rights, please contact us at support@understand.school or the student's educational institution.

7. Changes to this privacy policy

We may update our privacy policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. We will notify you of any material changes by posting the updated privacy policy on our website, and we encourage you to review it periodically.

8. International data transfers

Understand is based in the United States (US). If you are accessing our service from outside of the US, please note that your information may be transferred to, stored, and processed in the US. By using our service, you consent to the transfer of your information to the US and the use and disclosure of your information in accordance with this privacy policy.

9. Contact us

If you have any questions, concerns, or requests related to this privacy policy, please contact our founder at david@understand.school or by phone at +1 (707) 806-9894.

10. Compliance with student privacy laws

We adhere to applicable federal student privacy laws, including the Family Educational Rights and Privacy Act (FERPA) and the Children's Online Privacy Protection Act (COPPA). If you believe we have not complied with these laws, please contact us at support@understand.school.

11. California privacy rights

If you are a California resident, you have certain rights under the California Consumer Privacy Act (CCPA), including the right to access, delete, and opt out of the sale of your personal information. Since we do not sell your personal information, the right to opt out of the sale does not apply. To exercise your right to access or delete your personal information, please contact us at support@understand.school.

12. EU/EEA and UK data subjects

If you are a data subject in the European Union (EU), European Economic Area (EEA), or the United Kingdom (UK), you have certain rights under the General Data Protection Regulation (GDPR) or UK GDPR, including the right to access, correct, delete, restrict the processing of, or object to the processing of your personal information. To exercise these rights, please contact us at support@understand.school.

Additionally, if you are an EU/EEA or UK data subject, you have the right to lodge a complaint with your local data protection authority.

13. Age restrictions

Our service is intended for use by educational institutions, educators, and students. If we become aware that we have collected personal information from a child under the age of 13 without verifiable parental consent, we will take steps to delete that information promptly.

14. Third-party links

Our service may contain links to third-party websites, products, or services. We are not responsible for the privacy practices of these third parties, and we encourage you to review their privacy policies before providing them with your personal information.

15. Updates to your information

If you need to update or correct your personal information, please contact us at support@understand.school or update it directly through your account settings.

By using our service, you acknowledge and agree to the terms of this privacy policy. If you do not agree with any part of this privacy policy, you should not use our service.`

export default function PrivacyPolicyPage() {
	return (
		<main className="p-28 sm-mobile:p-6 lg-mobile:p-8">
			<h1 className="mb-5 select-text text-5xl font-extrabold leading-none tracking-tight text-black/80">
				Privacy Policy
			</h1>

			<h2 className="mb-4 select-text text-2xl font-medium leading-none tracking-tight text-black/80">
				Effective date: August 27, 2023
			</h2>

			<p className="select-text whitespace-pre-wrap text-lg text-black/70">
				{privacyPolicyContent}
			</p>
		</main>
	)
}
