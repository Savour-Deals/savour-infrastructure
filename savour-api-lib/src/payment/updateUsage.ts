import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Stripe } from "stripe";
import { success, failure } from "../common/response-lib";

const stripe = new Stripe(process.env.stripeKey, {
	apiVersion: null, //null uses Stripe account's default version
});

interface UpdateUsageRequest{
	subscriptionItem: string,
	quantity: number
}

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request: UpdateUsageRequest = JSON.parse(event.body);

	return stripe.subscriptionItems.createUsageRecord(
		request.subscriptionItem,
		{quantity: request.quantity, timestamp: Math.floor(Date.now()/1000)}
	).then((usageRecord: Stripe.UsageRecord) => {
		return success({ usage: usageRecord });
	}).catch((e) => {
		console.log(`An error occured updating subscription (${request.subscriptionItem}, ${request.quantity}) usage: ${e}`);
		return failure({ error: "An error occured updating subscription usage" });
  });
}