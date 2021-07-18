import businessDao from 'src/dao/businessDao';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import Business from "src/model/business";
import { Stripe } from "stripe";
import { success, failure } from "../common/response-lib";

const stripe = new Stripe(process.env.stripeKey, {
	apiVersion: null, //null uses Stripe account's default version
});

interface CreateCustomerRequest {
	customerId?: string,
	email: string,
  name: string,
	paymentMethod?: string,
	subscriptions: {
		recurring: string,
		usage: string,
	}
}

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request: CreateCustomerRequest = JSON.parse(event.body);
	const businessId: string = event.pathParameters.id;
	let business: Business;
	return businessDao.get(businessId).then((result) => {
		business = result;
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
		return Promise.resolve(request.customerId);
	}).then((customerId) => {
		return stripe.subscriptions.create({
			customer: customerId,
			items: [
				{ price: request.subscriptions.recurring },
				{ price: request.subscriptions.usage },
			],
		});
	}).then((subscription) => {
		
		//subscription created succesfully. Store in dynamoDB and return a success
		business.stripeCustomerId = subscription.customer as string;
		business.stripePaymentMethod = request.paymentMethod;
		business.stripeSubId = subscription.id;
		business.stripeRecurringSubItem = subscription.items.data.find(i => i.price.id === request.subscriptions.recurring).id;
		business.stripeUsageSubItem = subscription.items.data.find(i => i.price.id === request.subscriptions.usage).id;
		
		return businessDao.update(business.id, business)
		.then((result) => success(result))
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

function createStripeCustomer(email: string, businessId: string, name: string, paymentMethod: string): Promise<Stripe.Customer> {
	return stripe.customers.create({
		email: email,
		metadata: {businessId: businessId},
		name: name,
		payment_method: paymentMethod,
		invoice_settings: {
			default_payment_method: paymentMethod
		}
	}).catch((e) => {
		console.log(e);
		throw new Error("An error occured creating the customer account for this business");
	});
}