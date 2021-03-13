import { Stripe } from "stripe";
import { success, failure } from "../common/response-lib";

const stripe = new Stripe(process.env.stripeKey, {
	apiVersion: null, //null uses Stripe account's default version
});

export default async function main(event) {
  const data = JSON.parse(event.body);
	const subscriptionItem: string = data.subscription_item;
	const quantity: number = data.quantity;

	return stripe.subscriptionItems.createUsageRecord(
		subscriptionItem,
		{quantity: quantity, timestamp: Math.floor(Date.now()/1000)}
	).then((usageRecord: Stripe.UsageRecord) => {
		return success({ status: true, usageRecord: usageRecord });
	}).catch((e) => {
		console.log(`An error occured updating subscription (${subscriptionItem}, ${quantity}) usage: ${e}`);
		return failure({ status: false, error: "An error occured updating subscription usage" });
  });
}