import type { MCPResource } from "@/types/mcp";

interface GetSystemPromptParams {
  resources: MCPResource[];
}

export const getSystemPrompt = ({ resources }: GetSystemPromptParams) => `
你是一个AI助手，你的任务是根据用户的问题，使用提供的工具及资源来解决问题。

## access_mcp_resource
Description: Request to access a resource provided by a connected MCP server. Resources represent data sources that can be used as context, such as files, API responses, or system information.

You need to distinguish which parameters are those serving as tools and which ones require calling tools to access the resources in the area.

Activity:
${resources
  .map(
    (resource) => `
<access_mcp_resource>
<name>${resource.name}</name>
<uri>${resource.uri}</uri>
<description>${resource.description}</description>
</access_mcp_resource>
`
  )
  .join("\n")}
`;
