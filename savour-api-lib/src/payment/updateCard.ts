import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Stripe } from "stripe";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

const stripe = new Stripe(process.env.stripeKey, {
	apiVersion: null, //null uses Stripe account's default version
});

interface UpdateCardRequest {
	customerId: string,
	paymentMethod: string
}

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request: UpdateCardRequest = JSON.parse(event.body);
	const businessId: string = event.pathParameters.id;

	//Attach a new payment method to customer
	return stripe.paymentMethods.attach(request.paymentMethod, {
		customer: request.customerId
	}).then((paymentMethod) => {
		//set this new payment method as default
		return stripe.customers.update(request.customerId,{
			invoice_settings: {
				default_payment_method: paymentMethod.id
			}
		});
	}).then((customer) => {
		//update database with new payment method
		const params = {
			TableName: process.env.businessTable,
			Key: {
				place_id: businessId,
			},
			UpdateExpression: "stripePaymentMethod = :stripePaymentMethod",
			ExpressionAttributeValues: {
				':stripePaymentMethod': customer.invoice_settings.default_payment_method,
			},
			ReturnValues: "ALL_NEW"
		};
		return dynamoDb.call("update", params).then((result) => success(result.Item))
		.catch((e) => {
			console.log(e);
			return failure({ error: "Error occured saving new payment method" });
		});
	}).catch((e) => {
		console.log(`An error occured updating the default payment method of business ${businessId} (payment: ${request.paymentMethod}, customer: ${request.customerId}): ${e}`);
		return failure({ error: "An error occured updating the default payment method of this business" });
  });
}
