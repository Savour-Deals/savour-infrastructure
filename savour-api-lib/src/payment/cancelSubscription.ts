import { Stripe } from "stripe";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

const stripe = new Stripe(process.env.stripeKey, {
	apiVersion: null, //null uses Stripe account's default version
});

export default async function main(event) {
  const data = JSON.parse(event.body);
	const subscriptionId: string = data.subscription_id;
	const businessId: string = event.pathParameters.place_id;

	//cancel subscription immediately and send prorated invoice.
	return stripe.subscriptions.del(subscriptionId, {
		invoice_now: true, 
		prorate: true
	}).then(() => {
		//now delete all corresponding data in AWS
		const params = {
			TableName: process.env.businessTable,
			Key: {
				place_id: businessId,
			},
			UpdateExpression: "REMOVE stripe_payment_method, stripe_sub_id, stripe_recurring_sub_item, stripe_usage_sub_item",
			ReturnValues: "ALL_NEW"
		};
		return dynamoDb.call("update", params).then(() => success({ status: true }))
		.catch((e) => {
			console.log(e);
			throw new Error("Failed to remove subscription data.")
		});
	}).catch((e) => {
		console.log(`An error occured while cancelling subscription (${subscriptionId}) for business ${businessId}: ${e}`);
		//error occured, return error to caller
		return failure({ status: false, error: "An error occured while cancelling the subscription" });
  });
}