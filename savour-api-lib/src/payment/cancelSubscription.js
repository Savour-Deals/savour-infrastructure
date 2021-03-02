import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

var stripe = require('stripe')(process.env.stripeKey);

export default async function main(event, context) {
  const data = JSON.parse(event.body);

	//cancel subscription immediately and send prorated invoice.
	return stripe.subscriptions.del(
		data.subscription_id,
		{invoice_now: true, prorate: true}
	).then(async(_) => {
		//now delete all corresponding data in AWS
		const params = {
			TableName: process.env.businessTable,
			// 'Key' defines the partition key and sort key of the item to be retrieved
			// - 'place_id': Business ID identifying Google id
			Key: {
				place_id: event.pathParameters.place_id,
			},
			// 'UpdateExpression' defines the attributes to be updated
			// 'ExpressionAttributeValues' defines the value in the update expression
			UpdateExpression: "REMOVE stripe_payment_method, stripe_sub_id, stripe_recurring_sub_item, stripe_usage_sub_item",
			// 'ReturnValues' specifies if and how to return the item's attributes,
			// where ALL_NEW returns all attributes of the item after the update; you
			// can inspect 'result' below to see how it works with different settings
			ReturnValues: "ALL_NEW"
		};

		try {
			await dynamoDb.call("update", params);
			return success({ status: true });
		} catch (e) {
			console.log
			return failure({ status: false });
		}
	}).catch((err) => {
		console.log(err);
		//error occured, return error to caller
		return failure({ status: false, error: err });
  });
}