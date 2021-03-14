import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Stripe } from "stripe";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

const stripe = new Stripe(process.env.stripeKey, {
	apiVersion: null, //null uses Stripe account's default version
});

interface CancelSubscriptionRequest {
	subscriptionId: string
}

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request: CancelSubscriptionRequest = JSON.parse(event.body);
	const businessId: string = event.pathParameters.id;

	//cancel subscription immediately and send prorated invoice.
	return stripe.subscriptions.del(request.subscriptionId, {
		invoice_now: true, 
		prorate: true
	}).then(() => {
		//now delete all corresponding data in AWS
		const params = {
			TableName: process.env.businessTable,
			Key: {
				place_id: businessId,
			},
			UpdateExpression: "REMOVE stripePaymentMethod, stripeSubId, stripeRecurringSubItem, stripeUsageSubItem",
			ReturnValues: "ALL_NEW"
		};
		return dynamoDb.call("update", params).then(() => success(request.subscriptionId))
		.catch((e) => {
			console.log(e);
			throw new Error("Failed to remove subscription data.")
		});
	}).catch((e) => {
		console.log(`An error occured while cancelling subscription (${request.subscriptionId}) for business ${businessId}: ${e}`);
		//error occured, return error to caller
		return failure({ error: "An error occured while cancelling the subscription" });
  });
}