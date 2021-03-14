export default interface Business {
	id: string,
	businessName: string,
	address: string,
	presetMessages: string[],
	onboardMessage: string,
	stripeCustomerId?: string,
	stripePaymentMethod?: string,
	stripeSubId?: string,
	stripeRecurringSubItem?: string,
	stripeUsageSubItem?: string,
	twilioNumber?: string,
	subscriberMap: Map<string, SubscriberInfo>
}

interface SubscriberInfo {
	subscribed: boolean
}