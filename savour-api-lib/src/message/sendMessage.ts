import { APIGatewayProxyResult, SQSEvent } from "aws-lambda";

import Business from 'src/model/business';
import PushItem from 'src/model/push';

import { success, failure } from "../common/response-lib";
import * as twilio from "../common/twilio-lib";

import shorten from '../url/shorten';
import businessDao from 'src/dao/businessDao';
import pushDao from "src/dao/pushDao";

const SHORT_DOMAIN: string = process.env.shortUrlDomain;

interface SendMessageRequest {
	campaignId: string,
}

export default async function main(event: SQSEvent): Promise<any> {
	console.log(event);
	return Promise.all(event.Records
		.map((record) => handleSendMessageRecord(JSON.parse(record.body))))
		.then(() => success("success"))
		.catch((e) => {
			console.log(e);
			return failure(e);
		});
}

async function handleSendMessageRecord(request: SendMessageRequest): Promise<any> {
	let campaign: PushItem;

	return pushDao.get(request.campaignId).then((campaignRecord) => {
		campaign = campaignRecord;
		const promises: [Promise<Business>, Promise<string>] = [
			businessDao.get(campaign.businessId), 
			campaign.link ? shorten(campaign.link, SHORT_DOMAIN) : Promise.resolve(undefined)
		];
		return Promise.all(promises);
	}).then(([business, shortLink]) => {
		if (campaign.link && !shortLink) {
			throw new Error("An error occured creating a short link.");
		}
		
		if (business) {
			const businessNumber = business.messagingNumber;
      const subscribers = Object.entries(business.subscriberMap).filter(([_, subscriber]) => subscriber.subscribed);
			const messagePromises = subscribers.map(([subscriberNumber, _]) => {
				return twilio.sendMessage(businessNumber, subscriberNumber, campaign.message, shortLink)});
			return Promise.all(messagePromises);
    } else {
      throw new Error("Cound not find business to send message.");
    }
	})
	.then((results) =>  messageAudit({
		...campaign,
		campaignStatus: "SENT",
		twilioResponse: results.map((r) => r.toJSON()),
		lastUpdatedDateTimeUtc: new Date().toISOString()
	}))
	.then((result) => success({
		messageId: result
	})).catch((e) => {
		console.log(e);
		return messageAudit({
			...campaign,
			campaignStatus: "SENDING_FAILED",
			lastUpdatedDateTimeUtc: new Date().toISOString()
		}).then(() => failure({ 
			status: false,
			error: "An error occured trying to send the campaign messages." 
		}));
	});
}

async function messageAudit(auditRecord: PushItem): Promise<PushItem> {
	console.log(auditRecord);
	return pushDao.create(auditRecord)
	.then((result) => result)
	.catch((e) => {
		console.log(e);
		//eat this error, the message already sent. This is just not ideal for data post processing
		return auditRecord;
	});
}