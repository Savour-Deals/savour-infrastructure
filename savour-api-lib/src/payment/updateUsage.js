var stripe = require('stripe')(process.env.stripeKey);
import { success, failure } from "../common/response-lib";

export default async function main(event, context) {
  const data = JSON.parse(event.body);

	return stripe.subscriptionItems.createUsageRecord(
		data.subscription_item,
		{quantity: data.quantity, timestamp: Math.floor(Date.now()/1000)}
	).then((usageRecord) => {
		return success({ status: true, usageRecord: usageRecord });
	}).catch((err) => {
		console.log(err);
		//error occured, return error to caller
		return failure({ status: false, error: err });
  });
}