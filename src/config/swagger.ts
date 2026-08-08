import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "SpotQ Order Service API",
			version: "1.0.0",
			description: "API documentation for the SpotQ Order Service.",
		},
		servers: [
			{
				url: "/",
			},
		],
	},
	apis: ["./src/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
