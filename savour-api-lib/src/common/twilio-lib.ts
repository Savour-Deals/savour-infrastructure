import { Twilio } from "twilio";
import { LocalInstance } from "twilio/lib/rest/api/v2010/account/availablePhoneNumber/local";
import { IncomingPhoneNumberInstance } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";
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