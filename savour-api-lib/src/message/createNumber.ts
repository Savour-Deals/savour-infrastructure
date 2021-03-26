import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as dynamoDbLib from "../common/dynamodb-lib";
import * as twilio from "../common/twilio-lib";
import { getSSMParameter } from './../common/ssm-lib';
import { success, failure } from "../common/response-lib";

interface CreateNumberRequest {
	businessId: string
}

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
	//query for phone number in US
	const stage = process.env.stage;
  const request: CreateNumberRequest = JSON.parse(event.body);
	console.log(request);

	return createTwilioNumber(stage, request.businessId)
	.then((phoneNumber) => {
		return persistNumber(request.businessId, phoneNumber);
	}).then((number) => {
		return success(number);
	})
	.catch((e) => {
		console.log(`An error occured creating number for request: ${JSON.stringify(request)}: ${e}`);
		return failure({ error: "An error occured creating your messaging number."})
	});
}

function persistNumber(businessId: string, phoneNumber: string) {
	const params = {
		TableName: process.env.businessTable,
		Key: {
			id: businessId,
		},
		UpdateExpression: "SET messagingNumber = :number",
		ExpressionAttributeValues: {
			':number': phoneNumber
		},
		ReturnValues: "ALL_NEW"
	};
	return dynamoDbLib.call("update", params).then(() => phoneNumber);
}

function createTwilioNumber(stage: string, businessId: string): Promise<string> {
	return Promise.all([
		getSSMParameter({Name: `/api/execute-url/${stage}`}),
		twilio.getLocalNumber(stage)
	])
	.then(([url, phoneNumber]) => {
		const webhook = url + process.env.path;
		//provision phone number
		return twilio.provisionNumber(businessId, phoneNumber, webhook);
	}).then(p => p.phoneNumber)
	.catch((e) => {
		console.log(e);
		throw new Error(`An error occured creating the messaging number. ${e}`);
	});
}