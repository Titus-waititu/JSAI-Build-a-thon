import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from 'dotenv';

dotenv.config();

const client = new ModelClient(
  process.env.AZURE_INFERENCE_SDK_ENDPOINT ??
    "https://wanja-mbz8zypb-eastus2.services.ai.azure.com/models",
  new AzureKeyCredential(process.env.AZURE_INFERENCE_SDK_KEY ?? "YOUR_KEY_HERE")
);

var messages = [
  { role: "system", content: "You are an helpful assistant" },
  { role: "user", content: "What are 3 things to see in Seattle?" },
];

var response = await client.path("chat/completions").post({
  body: {
    messages: messages,
    max_tokens: 4096,
    temperature: 1,
    top_p: 1,
    model: "gpt-4o",
  },
});

console.log(JSON.stringify(response.body.choices[0].message.content));
