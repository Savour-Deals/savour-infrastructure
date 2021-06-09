import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Stripe } from "stripe";
import { success, failure } from "../common/response-lib";
import businessDao from 'src/dao/businessDao';

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
		return Promise.all([
			stripe.customers.update(request.customerId,{
				invoice_settings: {
					default_payment_method: paymentMethod.id
				}
			}),
			businessDao.get(businessId)
		])
	}).then(([customer, business]) => {
		//update database with new payment method
		business.stripePaymentMethod = customer.invoice_settings.default_payment_method as string;
		return businessDao.update(businessId, business);
	}).then((business) => success(business))
	.catch((e) => {
		console.log(`An error occured updating the default payment method of business ${businessId} (payment: ${request.paymentMethod}, customer: ${request.customerId}): ${e}`);
		return failure({ error: "An error occured updating the default payment method of this business" });
  });
}
