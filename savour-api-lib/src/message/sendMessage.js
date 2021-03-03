const client = require('twilio')(process.env.accountSid, process.env.authToken);
import shorten from '../url/shorten';
import { success, failure } from "../common/response-lib";
import { v4 as uuidv4 } from 'uuid';

export default async function main(event, context) {
	console.log(event);
	const data = JSON.parse(event.body);
  const message = data.message;
  const link = data.link;
  const businessId = data.businessId;
	const messageId = uuidv4();

	var promises = [getBusiness(businessId)];
	if (link) {
		promises.push(shorten(link, process.env.shortUrlDomain));
	}

	return Promise.all(promises).then((results) => {
		const business = results[0];
		const shortLink = results[1];

		if (link && !shortLink) {
			throw new Error("An error occured creating a short link.");
		}
		
		if (business) {
			const businessNumber = business.twilio_number;
      const subscribers = Object.entries(business.subscriber_map).filter((_, subscriber) => subscriber.subscribed);
			const messagePromises = Object.keys(subscribers).map((subscriberNumber) => sendMessage(businessNumber, subscriberNumber, message, shortLink));
			return Promise.all(messagePromises);
    } else {
      throw new Error("Cound not find buiness to send message.");
    }
	})
	.then((results) =>  messageAudit(messageId, results.map((r) => r.toJSON())))
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

async function getBusiness(businessId) {
  const params = {
    TableName: process.env.businessTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'place_id': Business ID identifying Google id
    Key: {
      place_id: businessId,
    }
  };

  return dynamoDb.call("get", params).then((result) => result.Item);
}

async function sendMessage(businessNumber, subscriberNumber, message, shortLink) {
	let messageBody = `${message} ${shortLink ? `${shortLink} ` : ""}HELP 4 help, STOP 2 Unsub.`;

	return client.messages.create({
		body: messageBody,
		from: businessNumber,
		to: subscriberNumber,
	});
}


async function messageAudit(messageId, results){
	const params = {
		TableName: process.env.pushMessageTable,
		Item: {
			unique_id: messageId,
			send_date_time: new Date().toISOString(),
			twilio_esponse: results,
		},
		ConditionExpression: 'attribute_not_exists(unique_id)'
	};
	return dynamoDbLib.call("put", params)
	.then(() => messageId)
	.catch((e) => {
		console.log(e);
		//eat this error, the message already sent. This is just not idea for data post processing
		return messageId;
	});
}