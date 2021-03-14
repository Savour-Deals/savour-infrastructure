import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Business from "src/model/business";
import { Stripe } from "stripe";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

const stripe = new Stripe(process.env.stripeKey, {
	apiVersion: null, //null uses Stripe account's default version
});

interface CreateCustomerRequest {
	customerId?: string,
	email: string,
  name: string,
	paymentMethod: string
}

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request: CreateCustomerRequest = JSON.parse(event.body);
	const businessId: string = event.pathParameters.id;

	return getBusiness(businessId).then((business) => {
		if (!business) {
			throw new Error("Business does not exist.");
		}

		if (business.stripeSubId) {
			throw new Error("This business is already subscribed.");
		}

		//If we are re-subscribing, use the customer we already have
		//Otherwise we must create a new customer.
		if (!request.customerId){
			//Create a customer with data sent to us
			return createStripeCustomer(request.email, businessId, request.name, request.paymentMethod)
			.then((customer) => customer.id);
		}
		return request.customerId;
	}).then((customerId) => {
		return stripe.subscriptions.create({
			customer: customerId,
			items: [
				{plan: process.env.recurringPlanID},
				{plan: process.env.usagePlanID}
			],
		});
	}).then((subscription) => {
		//subscription created succesfully. Store in dynamoDB and return a success		
		const usageSubId = subscription.items.data.find((item) => item.plan.id === process.env.usagePlanID).id;
		const recurringSubId = subscription.items.data.find((item) => item.plan.id === process.env.recurringPlanID).id;

		const params = {
			TableName: process.env.businessTable,
			Key: {
				place_id: businessId,
			},
			UpdateExpression: "SET stripeCustomerId = :stripeCustomerId, stripePaymentMethod = :stripePaymentMethod, stripeSubId = :stripeSubId, stripeRecurringSubItem = :stripeRecurringSubItem, stripeUsageSubItem = :stripeUsageSubItem",
			ExpressionAttributeValues: {
				':stripeCustomerId': subscription.customer,
				':stripePaymentMethod': request.paymentMethod,
				':stripeSubId': subscription.id,
				':stripeRecurringSubItem': recurringSubId,
				':stripeUsageSubItem': usageSubId,
			},
			ReturnValues: "ALL_NEW"
		};
		return dynamoDb.call("update", params).then((response) => success(response.Item))
		.catch((e) => {
			console.log(e);
			throw new Error("An error occured persisting this business' subscription data");
		});
	})
	.catch((e) => {
		console.log(`An error occured creating customer for business ${businessId}: ${e}`);
		return failure({ error: "An error occured creating your subscription." });
	});
}


function getBusiness(businessId: string): Promise<Business> {
	const params = {
    TableName: process.env.businessTable,
    Key: {
      id: businessId,
    }
  };
	return dynamoDb.call("get", params)
	.then((result) => result.Item)
	.catch((e) => {
		console.log(e);
		throw new Error("An error occured looking up the business")
	});
}

function createStripeCustomer(email: string, businessId: string, name: string, paymentMethod: string): Promise<Stripe.Customer>{
	return stripe.customers.create({
		email: email,
		metadata: {place_id: businessId},
		name: name,
		payment_method: paymentMethod
	}).catch((e) => {
		console.log(e);
		throw new Error("An error occured creating the customer account for this business");
	});
}