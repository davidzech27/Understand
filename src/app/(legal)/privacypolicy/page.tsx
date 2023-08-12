const privacyPolicyContent = `Compliance with Student Privacy Laws
We are dedicated to upholding the importance of adhering to relevant federal student privacy laws, such as FERPA and COPPA. If you believe that we have not complied with these laws, please get in touch with us at support@understand.school.

Data Collection
In order to provide our Service, we gather information across various categories:

a. Account Details: When you create an account on Understand, we ask for your name, and email, and possibly other information needed for the operation of our product.  Additionally, we may access Google Classroom rosters and other pertinent information for our product's functionality. For educators or administrators, we might also request your role and the name of your educational institution.

b. Student Information: We collect data about students and google classrooms focusing solely on obtaining necessary information for our Service. This includes google classroom rosters, as well as students names, emails etc. 

c. User inputted and generated content: Engaging with the Understand platform leads to a variety of User generated content and user inputted content which is collected. User-generated content is shared with OpenAI through their GPT API.

d. Usage Insights: We gather information about your interactions with our Service, including feature usage, time spent on the platform, and device details, to enhance the user experience and improve our services.

e. Technical Data: To ensure seamless functionality across devices, we collect technical data such as IP addresses, browser types, device information, and operating systems.

European data clarifications:
Individuals in the EU, EEA, or the UK have specific rights under the GDPR or UK GDPR. These rights include access, correction, deletion, processing restriction, and objection to personal information processing. To exercise these rights, please contact us at support@understand.school. Additionally, EU/EEA or UK data subjects have the right to lodge a complaint with their local data protection authority.

Information Sharing and Disclosure
We do not sell or rent your personal information to third parties. However, there are specific instances in which we may share your information:

a. Service Providers: Third-party service providers who assist in operating and maintaining our Service may access your information, subject to strict confidentiality and usage restrictions.

b. Legal Obligations: We may disclose information if required by law, in response to a subpoena, court order, or government request.

c. Business Transfers: If mergers, acquisitions, or asset sales occur, your information may be transferred as part of the transaction.

Data Retention and Deletion
We retain personal information only as long as necessary to fulfill its intended educational purpose. To request account deletion and removal of personal information, please contact us at hello@understand.school. For students, parents, or guardians, such requests can be made through the student's educational institution or directly to us.


Utilization of Information
We use the collected data to:

a. Enhance and Improve: We use the gathered data to improve our Service and customize the user experience, continually refining the platform.

b. Account Support: Essential aspects of our utilization involve supporting user accounts, authenticating users, and managing access control.

c. Usage Analysis: Analyzing usage patterns helps us enhance user experience and optimize our services.

d. Effective Communication: We use the information to communicate updates about accounts or promptly respond to customer support inquiries.

e. Security and Compliance: Ensuring Service security, detecting and preventing fraudulent activities, and enforcing our Terms of Service rely on the data we collect.

f. Legal Compliance: Adhering to legal obligations and responding to lawful requests from authorities are essential to our operations.

Access and Control
Parents or guardians have the right to review their child's personal information collected by our Service, correct inaccuracies, and request deletion of information violating privacy laws. To exercise these rights, please contact us at hello@understand.school or the student's educational institution.

California Privacy Rights
As a California resident, you have specific rights under the CCPA, including access, deletion, and the ability to opt-out of the sale of personal information. Since we do not sell personal information, the right to opt-out of the sale does not apply. To exercise your right to access or delete personal information, please contact us at support@understand.school.

Changes to the Privacy Policy
To reflect changes in our practices or comply with legal, regulatory, or operational requirements, we may update our Privacy Policy. Material changes will be communicated by posting the updated policy on our website, so we encourage you to review it periodically.

Outside of US Data Transfers
Understand is based in the United States (US). If you access our Service from outside the US, please note that your information may be transferred, stored, and processed in the US. Using our Service implies consent to such transfer, storage, and processing of information as per this Privacy Policy.

Contact Us
For questions, concerns, or requests related to this Privacy Policy, please contact us at support@understand.school.

Age Restrictions
Understand is designed for use by educational institutions, educators, and students above 13. If we discover that personal information has been collected from a child under 13 without verifiable parental consent, we will promptly take steps to delete that information.

Third-Party Links
Our Service may contain links to third-party websites, products, or services. We are not responsible for the privacy practices of these third parties and recommend reviewing their privacy policies before providing personal information.

Updates to Personal Information
To update or correct personal information, please contact us at hello@understand.school or make changes directly through your account settings.

Other Data:
We may collect, or receive via student input other data not explicitly outlined here which is necessary for our products functionality.

By using our Service, you acknowledge and agree to the terms of this Privacy Policy. If you do not consent to any part of this Privacy Policy, please refrain from using our Service.`

export default function PrivacyPolicyPage() {
	return (
		<main className="p-28 sm-mobile:p-6 lg-mobile:p-8">
			<h1 className="mb-4 select-text text-5xl font-extrabold leading-none tracking-tight text-black/80">
				Privacy Policy
			</h1>

			<p className="select-text whitespace-pre-wrap text-lg text-black/70">
				{privacyPolicyContent}
			</p>
		</main>
	)
}
