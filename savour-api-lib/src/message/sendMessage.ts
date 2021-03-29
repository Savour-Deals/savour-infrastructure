import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';

import Business from 'src/model/business';
import PushItem from 'src/model/push';
import { SubscriberInfo } from 'src/model/subscriberUser';

import { success, failure } from "../common/response-lib";
import * as twilio from "../common/twilio-lib";

import shorten from '../url/shorten';
import businessDao from 'src/dao/businessDao';
import pushDao from "src/dao/pushDao";

const SHORT_DOMAIN: string = process.env.shortUrlDomain;

interface SendMessageRequest {
	message: string,
	link: string,
	businessId: string
}

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
	console.log(event);
	const request: SendMessageRequest = JSON.parse(event.body);
	const messageId = uuidv4();

	const promises: [Promise<Business>, Promise<string>] = [
		businessDao.get(request.businessId), 
		request.link ? shorten(request.link, SHORT_DOMAIN) : Promise.resolve(undefined)
	];

	return Promise.all(promises).then(([business, shortLink]) => {
		if (request.link && !shortLink) {
			throw new Error("An error occured creating a short link.");
		}
		
		if (business) {
			const businessNumber = business.messagingNumber;
      const subscribers = Object.entries(business.subscriberMap).filter(([_, subscriber]) => subscriber.subscribed);
			const messagePromises = Object.keys(subscribers).map((subscriberNumber) => 
				twilio.sendMessage(businessNumber, subscriberNumber, request.message, shortLink));
			return Promise.all(messagePromises);
    } else {
      throw new Error("Cound not find business to send message.");
    }
	})
	.then((results) =>  messageAudit(messageId, request.businessId, results.map((r) => r.toJSON())))
	.then((result) => success({
		messageId: result
	})).catch((e) => {
		console.log(e);
		return failure({ 
			status: false,
			error: "An error occured trying to send the message." 
		});
	})
}

function messageAudit(messageId: string, businessId: string, results: any[]): Promise<PushItem> {
	const newItem: PushItem = {
		id: messageId,
		businessId: businessId,
		sentDateTime: new Date().toISOString(),
		twilioResponse: results,
	};
	return pushDao.create(newItem)
	.then((result) => result)
	.catch((e) => {
		console.log(e);
		//eat this error, the message already sent. This is just not ideal for data post processing
		return newItem;
	});
}