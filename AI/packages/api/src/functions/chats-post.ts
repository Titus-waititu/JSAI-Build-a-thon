import { Readable } from 'node:stream';
import { HttpRequest, InvocationContext, HttpResponseInit, app } from '@azure/functions';
import { AIChatCompletionRequest, AIChatCompletionDelta } from '@microsoft/ai-chat-protocol';
import { AzureOpenAIEmbeddings, AzureChatOpenAI } from '@langchain/openai';
import { Embeddings } from '@langchain/core/embeddings';
import { AzureCosmsosDBNoSQLChatMessageHistory, AzureCosmosDBNoSQLVectorStore } from '@langchain/azure-cosmosdb';
import { FileSystemChatMessageHistory } from '@langchain/community/stores/message/file_system';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { RunnableWithMessageHistory } from '@langchain/core/runnables';
import { VectorStore } from '@langchain/core/vectorstores';
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';
import { badRequest, data, serviceUnavailable } from '../http-response.js';
import { ollamaChatModel, ollamaEmbeddingsModel, faissStoreFolder } from '../constants.js';
import { getAzureOpenAiTokenProvider, getCredentials, getUserId } from '../security.js';

const ragSystemPrompt = `You are an Academic Advisor AI assistant specializing in online course recommendations and degree planning. Your expertise includes:

CAPABILITIES:
- Course discovery and recommendation based on student interests and career goals
- Degree requirement analysis and academic pathway planning
- Prerequisite checking and course sequencing guidance
- Program comparison and specialization advice
- Financial aid and scholarship information
- Online learning support and technology requirements

INSTRUCTIONS:
- Provide personalized academic guidance based on student goals
- Answer ONLY with information from the course catalog and degree cluster documents
- If information isn't available in sources, ask clarifying questions to better help the student
- Always reference course codes, prerequisites, and credit hours when discussing specific courses
- Consider the student's academic background when making recommendations
- Explain the reasoning behind course recommendations

RESPONSE FORMAT:
- Be helpful, encouraging, and professional
- Use plain text, NO Markdown formatting
- Always reference source documents using [filename] format
- Provide specific course codes and requirements when available

Generate 3 relevant follow-up questions about courses, prerequisites, or degree planning.
Enclose follow-up questions in double angle brackets. Examples:
<<What prerequisites do I need for this course?>>
<<How long will this program take to complete?>>
<<Are there any scholarship opportunities available?>>

SOURCES:
{context}`;

const titleSystemPrompt = `Create a concise title for this academic advising session based on the student's question. Focus on the degree program, course area, or academic goal discussed. Keep it under 32 characters. Examples: "CS Degree Planning", "Biology Prerequisites", "MBA Requirements". Do NOT use double-quotes.`;

export async function postChats(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const azureOpenAiEndpoint = process.env.AZURE_OPENAI_API_ENDPOINT;

  try {
    const requestBody = (await request.json()) as AIChatCompletionRequest;
    const { messages, context: chatContext } = requestBody;
    const userId = getUserId(request, requestBody);

    if (!messages || messages.length === 0 || !messages.at(-1)?.content) {
      return badRequest('Invalid or missing messages in the request body');
    }

    let embeddings: Embeddings;
    let model: BaseChatModel;
    let store: VectorStore;
    let chatHistory;
    const sessionId = ((chatContext as any)?.sessionId as string) || uuidv4();
    context.log(`userId: ${userId}, sessionId: ${sessionId}`);

    if (azureOpenAiEndpoint) {
      const credentials = getCredentials();
      const azureADTokenProvider = getAzureOpenAiTokenProvider();

      // Initialize models and vector database
      embeddings = new AzureOpenAIEmbeddings({ azureADTokenProvider });
      model = new AzureChatOpenAI({
        // Controls randomness. 0 = deterministic, 1 = maximum randomness
        temperature: 0.7,
        azureADTokenProvider,
      });
      store = new AzureCosmosDBNoSQLVectorStore(embeddings, { credentials });

      // Initialize chat history
      chatHistory = new AzureCosmsosDBNoSQLChatMessageHistory({
        sessionId,
        userId,
        credentials,
      });
    } else {
      // If no environment variables are set, it means we are running locally
      context.log('No Azure OpenAI endpoint set, using Ollama models and local DB');
      embeddings = new OllamaEmbeddings({ model: ollamaEmbeddingsModel });
      model = new ChatOllama({
        temperature: 0.7,
        model: ollamaChatModel,
      });
      store = await FaissStore.load(faissStoreFolder, embeddings);
      chatHistory = new FileSystemChatMessageHistory({
        sessionId,
        userId,
      });
    }

    // Create the chain that combines the prompt with the documents
    const ragChain = await createStuffDocumentsChain({
      llm: model,
      prompt: ChatPromptTemplate.fromMessages([
        ['system', ragSystemPrompt],
        ['human', '{input}'],
      ]),
      documentPrompt: PromptTemplate.fromTemplate('[{source}]: {page_content}\n'),
    });
    // Handle chat history
    const ragChainWithHistory = new RunnableWithMessageHistory({
      runnable: ragChain,
      inputMessagesKey: 'input',
      historyMessagesKey: 'chat_history',
      getMessageHistory: async () => chatHistory,
    });
    // Retriever to search for the documents in the database
    const retriever = store.asRetriever(3);
    const question = messages.at(-1)!.content;
    const responseStream = await ragChainWithHistory.stream(
      {
        input: question,
        context: await retriever.invoke(question),
      },
      { configurable: { sessionId } },
    );
    const jsonStream = Readable.from(createJsonStream(responseStream, sessionId));

    // Create a short title for this chat session
    const { title } = await chatHistory.getContext();
    if (!title) {
      const response = await ChatPromptTemplate.fromMessages([
        ['system', titleSystemPrompt],
        ['human', '{input}'],
      ])
        .pipe(model)
        .invoke({ input: question });
      context.log(`Title for session: ${response.content as string}`);
      chatHistory.setContext({ title: response.content });
    }

    return data(jsonStream, {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
    });
  } catch (_error: unknown) {
    const error = _error as Error;
    context.error(`Error when processing chat-post request: ${error.message}`);

    return serviceUnavailable('Service temporarily unavailable. Please try again later.');
  }
}

// Transform the response chunks into a JSON stream
async function* createJsonStream(chunks: AsyncIterable<string>, sessionId: string) {
  for await (const chunk of chunks) {
    if (!chunk) continue;

    const responseChunk: AIChatCompletionDelta = {
      delta: {
        content: chunk,
        role: 'assistant',
      },
      context: {
        sessionId,
      },
    };

    // Format response chunks in Newline delimited JSON
    // see https://github.com/ndjson/ndjson-spec
    yield JSON.stringify(responseChunk) + '\n';
  }
}

app.setup({ enableHttpStream: true });
app.http('chats-post', {
  route: 'chats/stream',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: postChats,
});
