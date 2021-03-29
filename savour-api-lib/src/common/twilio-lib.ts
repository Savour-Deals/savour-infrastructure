import { Twilio } from "twilio";
import { IncomingPhoneNumberInstance } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";
import { MessageInstance } from "twilio/lib/rest/api/v2010/account/message";
const client = new Twilio(process.env.accountSid, process.env.authToken);

export function getLocalNumber(stage: string): Promise<string> {
	if (stage === 'prod') {
		return client.availablePhoneNumbers.get('US').local.list({
			areaCode: 612,
			excludeAllAddressRequired: true,
			limit: 1
		}).then((local) => local[0].phoneNumber);
	}
	return Promise.resolve("+15005550006");
}

export function provisionNumber(businessId: string, phoneNumber: string, webhook: string): Promise<IncomingPhoneNumberInstance> {
	return client.incomingPhoneNumbers.create({
		phoneNumber: phoneNumber,
		friendlyName: businessId,
		smsUrl: webhook
	});
}

export function sendMessage(businessNumber: string, subscriberNumber: string, message: string, shortLink: string): Promise<MessageInstance> {
	const messageBody = `${message} ${shortLink ? `${shortLink} ` : ""}HELP 4 help, STOP 2 Unsub.`;

	return client.messages.create({
		body: messageBody,
		from: businessNumber,
		to: subscriberNumber,
	});
}