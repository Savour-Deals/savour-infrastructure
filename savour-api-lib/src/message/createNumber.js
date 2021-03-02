import * as dynamoDbLib from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";
const client = require('twilio')(process.env.accountSid, process.env.authToken);
import SSM from "aws-sdk/clients/ssm";
const ssm = new SSM();

export default async function main(event, context) {
	//query for phone number in US
  const data = JSON.parse(event.body);
	console.log(data);

	const placeId = data.place_id;
	const stage = process.env.stage;

	var number;
	if (stage == 'dev') {
		number = '+123456789';
	} else {
		const url = await ssm.getParameter(`/api/execute-url/${scope.stage}`).promise();
		number = await client.availablePhoneNumbers('US').local
			.list({
				// nearLatLong: '37.840699, -122.461853',
				// distance: 50,
				areaCode: '612',
				excludeAllAddressRequired: true,
				// inRegion: 'CA',
				limit: 1
			})
			.then(local => {
				var resource = local[0];

				const webhook = url + process.env.path;
				//provision phone number
				return client.incomingPhoneNumbers.create({
					phoneNumber: resource.phoneNumber,
					friendlyName: placeId,
					smsUrl: webhook
				});
			}).then(p => p.phoneNumber)
			.catch((err) => {
				//error occured, return error to caller
				console.log(err);
				return failure({ status: false, error: err });
			});
	}

	try {
		persistNumber(placeId, number);
	} catch(error) {
		console.log(error);
		return failure({ status: false });
	}
	return success({ status: true, twilioNumber: number});
}

async function persistNumber(placeId, number) {
	//store new number in DB
	const params = {
		TableName: process.env.businessTable,
		// 'Key' defines the partition key and sort key of the item to be retrieved
		// - 'place_id': Business ID identifying Google id
		Key: {
			place_id: placeId,
		},
		// 'UpdateExpression' defines the attributes to be updated
		// 'ExpressionAttributeValues' defines the value in the update expression
		UpdateExpression: "SET twilio_number = :twilio_number",
		ExpressionAttributeValues: {
			':twilio_number': number
		},
		// 'ReturnValues' specifies if and how to return the item's attributes,
		// where ALL_NEW returns all attributes of the item after the update; you
		// can inspect 'result' below to see how it works with different settings
		ReturnValues: "ALL_NEW"
	};
	await dynamoDbLib.call("update", params);
}