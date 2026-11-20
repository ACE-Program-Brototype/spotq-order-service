import prometheusClient from "prom-client";

prometheusClient.collectDefaultMetrics({
	prefix: "spotq_order_service_",
});

export default prometheusClient;
