export default interface SubscriberUser {
	mobileNumber: string,
	subscriptionMap: Map<string, SubscriberInfo>
}

export interface SubscriberInfo {
	subscribed: boolean,
	timestamp: string
}