import { Stripe } from "stripe";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

const stripe = new Stripe(process.env.stripeKey, {
	apiVersion: null, //null uses Stripe account's default version
});

function getBusiness(businessId: string): Promise<any> {
	const params = {
    TableName: process.env.businessTable,
    Key: {
      place_id: businessId,
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

export default async function main(event) {
  const data = JSON.parse(event.body);
	const businessId: string = event.pathParameters.place_id;
	const email: string = data.email;
	const name: string = data.name;
	const paymentMethod: string = data.paymentMethod;

	return getBusiness(businessId).then((business) => {
		if (!business) {
			throw new Error("Business does not exist.");
		}

		if (business.stripe_sub_id) {
			throw new Error("This business is already subscribed.");
		}

		//If we are re-subscribing, use the customer we already have
		//Otherwise we must create a new customer.
		if (!data.customer_id){
			//Create a customer with data sent to us
			return createStripeCustomer(email, businessId, name, paymentMethod)
			.then((customer) => customer.id);
		}
		return data.customer_id;
	}).then((customerId: string) => {
		return stripe.subscriptions.create({
			customer: customerId,
			items: [
				{plan: process.env.recurringPlanID},
				{plan: process.env.usagePlanID}
			],
		});
	}).then((subscription: Stripe.Subscription) => {
		//subscription created succesfully. Store in dynamoDB and return a success		
		const usageSubId: string = subscription.items.data.find((item) => item.plan.id === process.env.usagePlanID).id;
		const recurringSubId: string = subscription.items.data.find((item) => item.plan.id === process.env.recurringPlanID).id;

		const params = {
			TableName: process.env.businessTable,
			Key: {
				place_id: businessId,
			},
			UpdateExpression: "SET stripe_customer_id = :stripe_customer_id, stripe_payment_method = :stripe_payment_method, stripe_sub_id = :stripe_sub_id, stripe_recurring_sub_item = :stripe_recurring_sub_item, stripe_usage_sub_item = :stripe_usage_sub_item",
			ExpressionAttributeValues: {
				':stripe_customer_id': subscription.customer,
				':stripe_payment_method': paymentMethod,
				':stripe_sub_id': subscription.id,
				':stripe_recurring_sub_item': recurringSubId,
				':stripe_usage_sub_item': usageSubId,
			},
			ReturnValues: "ALL_NEW"
		};
		return dynamoDb.call("update", params).then(() => success({ status: true }))
		.catch((e) => {
			console.log(e);
			throw new Error("An error occured persisting this business' subscription data");
		});
	})
	.catch((e) => {
		console.log(`An error occured creating customer for business ${businessId}: ${e}`);
		return failure({ status: false, error: e });
	});
}