import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { WikipediaQueryRun } from "langchain/tools";
import { Calculator } from "langchain/tools/calculator";

import { AIMessage, ChatMessage, HumanMessage } from "langchain/schema";
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { PromptTemplate } from "langchain";

export const runtime = "edge";

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const PREFIX_TEMPLATE = `You are an expert on music and bands. You are talking to a person who is a music fan. Respond to their questions about music and bands in a very concise, but friendly manner. Take note of if the person asks to make a playlist and suggest a name of the playlist.\n\n`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    /**
     * We represent intermediate steps as system messages for display purposes,
     * but don't want them in the chat history.
     */
    const messages = (body.messages ?? []).filter(
      (message: VercelChatMessage) =>
        message.role === "user" || message.role === "assistant"
    );

    const previousMessages = messages
      .slice(0, -1)
      .map(convertVercelMessageToLangChainMessage);
    const currentMessageContent = messages[messages.length - 1].content;

    const tools = [new Calculator(), new WikipediaQueryRun()];
    const chat = new ChatOpenAI({
      modelName: /*"gpt-4"*/ "gpt-3.5-turbo",
      temperature: 0.8,
    });

    const schema = z.object({
      chat_response: z.string().describe("A response to the human's input"),
      // bands_response: z
      //   .optional(z.array(z.string()))
      //   .describe("A list of bands from the response"),
      // songs_response: z
      //   .optional(z.array(z.string()))
      //   .describe("A list of songs from the response"),
      create_playlist: z
        .optional(z.boolean())
        .describe("Whether to create a playlist from the input"),
      playlist_name: z
        .optional(z.string())
        .describe("The name of the playlist to create"),
      playlist: z
        .optional(z.array(z.string()))
        .describe("The list of bands and songs in the playlist"),
      play_now: z
        .optional(z.boolean())
        .describe("Whether the input asked to play songs immediately"),
    });
    /**
     * The default prompt for the OpenAI functions agent has a placeholder
     * where chat messages get injected - that's why we set "memoryKey" to
     * "chat_history". This will be made clearer and more customizable in the future.
     */
    const executor = await initializeAgentExecutorWithOptions(tools, chat, {
      agentType: "openai-functions",
      verbose: true,
      memory: new BufferMemory({
        memoryKey: "chat_history",
        chatHistory: new ChatMessageHistory(previousMessages),
        returnMessages: true,
        outputKey: "output",
      }),
      agentArgs: {
        prefix: PREFIX_TEMPLATE,
      },
    });

    const res1 = await executor.invoke({
      input: currentMessageContent,
    });

    const TEMPLATE = `Extract the requested fields from the input.
Input:

{input}`;

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);
    const model = new ChatOpenAI({
      temperature: 0.3,
      modelName: "gpt-3.5-turbo",
    });
    const functionCallingModel = model.bind({
      functions: [
        {
          name: "output_formatter",
          description: "Should always be used to properly format output",
          parameters: zodToJsonSchema(schema),
        },
      ],
      function_call: { name: "output_formatter" },
    });

    /**
     * Returns a chain with the function calling model.
     */
    const chain = prompt
      .pipe(functionCallingModel)
      .pipe(new JsonOutputFunctionsParser());

    const result = await chain.invoke({
      input: res1.output,
    });

    /**
     * Agent executors don't support streaming responses (yet!), so stream back the
     * complete response one character at a time with a delay to simluate it.
     */
    // const textEncoder = new TextEncoder();
    // const fakeStream = new ReadableStream({
    //   async start(controller) {
    //     for (const character of result) {
    //       controller.enqueue(textEncoder.encode(character));
    //       await new Promise((resolve) => setTimeout(resolve, 20));
    //     }
    //     controller.close();
    //   },
    // });

    // return new StreamingTextResponse(fakeStream);

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
