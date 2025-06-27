import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as os from "os";

const server = new McpServer({
    name: "node-os-mcp",
    description: "A server that provides tools to get information about the operating system.",
    version: "0.0.1",
});

server.tool(
"cpu_average_usage",
"Get the average CPU usage percentage on the local machine",
{},
async () => {
    // Calculate average CPU usage over 100ms
    function cpuAverage() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;

    for (const cpu of cpus) {
        for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
        }
        totalIdle += cpu.times.idle;
    }
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
    }

    const start = cpuAverage();
    await new Promise(res => setTimeout(res, 100));
    const end = cpuAverage();

    const idleDiff = end.idle - start.idle;
    const totalDiff = end.total - start.total;
    const usage = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;

    return {
    content: [{
        type: "text",
        text: `Average CPU usage: ${usage.toFixed(2)}%`
    }],
    isError: false
    };
}
);

server.tool(
"get_hostname",
"Get the hostname of the local machine",
{},
async () => ({
    content: [{
    type: "text",
    text: `Hostname: ${os.hostname()}`
    }],
    isError: false
    })
);

server.tool(
"get_architecture",
"Get the architecture of the local machine",
{},
async () => ({
    content: [{
    type: "text",
    text: `Architecture: ${os.arch()}`
    }],
    isError: false
    })
);

server.tool(
"get_uptime",
"Get the uptime of the local machine in seconds",
{},
async () => ({
    content: [{
    type: "text",
    text: `Uptime: ${os.uptime()} seconds`
    }],
    isError: false
    })
);

export { server };