import { Stripe } from "stripe";
import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

const stripe = new Stripe(process.env.stripeKey, {
	apiVersion: null, //null uses Stripe account's default version
});

export default async function main(event) {
  const data = JSON.parse(event.body);
	const customerId: string = data.customerId;
	const paymentMethodId: string = data.paymentMethod;
	const businessId: string = event.pathParameters.place_id;

	//Attach a new payment method to customer
	return stripe.paymentMethods.attach(paymentMethodId, {
		customer: customerId
	}).then((paymentMethod: Stripe.PaymentMethod) => {
		//set this new payment method as default
		return stripe.customers.update(customerId,{
			invoice_settings: {
				default_payment_method: paymentMethod.id
			}
		});
	}).then((customer: Stripe.Customer) => {
		//update database with new payment method
		const params = {
			TableName: process.env.businessTable,
			Key: {
				place_id: businessId,
			},
			UpdateExpression: "stripe_payment_method = :stripe_payment_method",
			ExpressionAttributeValues: {
				':stripe_payment_method': customer.invoice_settings.default_payment_method,
			},
			ReturnValues: "ALL_NEW"
		};
		return dynamoDb.call("update", params).then(() => success({ status: true }))
		.catch((e) => {
			console.log(e);
			return failure({ status: false, error: e });
		});
	}).catch((e) => {
		console.log(`An error occured updating the default payment method of business ${businessId} (payment: ${paymentMethodId}, customer: ${customerId}): ${e}`);
		return failure({ status: false, error: "An error occured updating the default payment method of this business" });
  });
}
