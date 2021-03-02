import * as dynamoDb from "../common/dynamodb-lib";
import { success, failure } from "../common/response-lib";

var stripe = require('stripe')(process.env.stripeKey);

export default async function main(event, context) {
  const data = JSON.parse(event.body);
	const business = await getBusiness(event.pathParameters.place_id);

	if (!business){
		return failure({ status: false, error: "Business does not exist." });
	}

	//check that business is not already subscribed
	if (business.stripe_sub_id){
		return failure({ status: false, error: "This business is already subscribed." });
	}

	var customerID = data.customer_id;
	//If we are re-subscribing, use the customer we already have
	//Otherwise we must create a new customer.
	if (!customerID){
		//Create a customer with data sent to us
		let customer = await stripe.customers.create({
			email: data.email,
			metadata: {place_id: event.pathParameters.place_id},
			name: data.name,
			payment_method: data.payment_method
		});
		customerID = customer.id;
	}

	return stripe.subscriptions.create({
		customer: customerID,
		items: [
			{plan: process.env.recurringPlanID},
			{plan: process.env.usagePlanID}
		],
	})
	.then(async(subscription) => {
		//subscription created succesfully. Store in dynamoDB and return a success
		var usageSubID, recurringSubID;
		subscription.items.data.forEach(subItem => {
			if (subItem.plan.id === process.env.usagePlanID){
				usageSubID = subItem.id;
			}else if (subItem.plan.id === process.env.recurringPlanID){
				recurringSubID = subItem.id;
			}
		});

		const params = {
			TableName: process.env.businessTable,
			// 'Key' defines the partition key and sort key of the item to be retrieved
			// - 'place_id': Business ID identifying Google id
			Key: {
				place_id: event.pathParameters.place_id,
			},
			// 'UpdateExpression' defines the attributes to be updated
			// 'ExpressionAttributeValues' defines the value in the update expression
			UpdateExpression: "SET stripe_customer_id = :stripe_customer_id, stripe_payment_method = :stripe_payment_method, stripe_sub_id = :stripe_sub_id, stripe_recurring_sub_item = :stripe_recurring_sub_item, stripe_usage_sub_item = :stripe_usage_sub_item",
			ExpressionAttributeValues: {
				':stripe_customer_id': subscription.customer,
				':stripe_payment_method': data.payment_method,
				':stripe_sub_id': subscription.id,
				':stripe_recurring_sub_item': recurringSubID,
				':stripe_usage_sub_item': usageSubID,
			},
			// 'ReturnValues' specifies if and how to return the item's attributes,
			// where ALL_NEW returns all attributes of the item after the update; you
			// can inspect 'result' below to see how it works with different settings
			ReturnValues: "ALL_NEW"
		};
		try {

			await dynamoDb.call("update", params);
			return success({ status: true });
		} catch (e) {
			console.log(e);
			return failure({ status: false, error: e });
		}
	})
  .catch((err) => {
		console.log(err);
		//error occured, return error to caller
		return failure({ status: false, error: err });
  });
}

async function getBusiness(placeID){
	const params = {
    TableName: process.env.businessTable,
    // 'Key' defines the partition key and sort key of the item to be retrieved
    // - 'mobile_number': Mobile number identifying user
    Key: {
      place_id: placeID,
    }
  };

  try {
    const result = await dynamoDb.call("get", params);
    if (result.Item) {
      // Return the retrieved item
			return result.Item;
    } else {
      return null;
    }
  } catch (e) {
		console.log(e);
    return null;
  }

}