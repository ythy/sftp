export function log(
  info: string,
  color: "green" | "red" | "yellow" | "blue" | "cyan" | "normal" = "normal"
) {
  if (color === "normal") {
    console.log(info);
  } else if (color === "red") {
    console.log("\x1b[31m%s\x1b[0m", info);
  } else if (color === "green") {
    console.log("\x1b[32m%s\x1b[0m", info);
  } else if (color === "yellow") {
    console.log("\x1b[33m%s\x1b[0m", info);
  } else if (color === "blue") {
    console.log("\x1b[34m%s\x1b[0m", info);
  } else if (color === "cyan") {
    console.log("\x1b[36m%s\x1b[0m", info);
  }
}

export function dateFormat(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
}
