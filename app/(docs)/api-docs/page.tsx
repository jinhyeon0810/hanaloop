import { SwaggerUiClient } from "./swagger-ui-client";

export const metadata = { title: "API 문서 · Hanaloop PCF" };

export default function ApiDocsPage() {
  return <SwaggerUiClient />;
}
