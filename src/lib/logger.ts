type LogFields = Record<string, unknown>;
type LogLevel = "info" | "warn" | "error";

function write(level: LogLevel, message: string, fields?: LogFields): void {
  const entry = {
    level,
    message,
    ...fields,
    timestamp: new Date().toISOString(),
  };
  const line = `${JSON.stringify(entry)}\n`;

  if (level === "error") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  info(message: string, fields?: LogFields): void {
    write("info", message, fields);
  },
  warn(message: string, fields?: LogFields): void {
    write("warn", message, fields);
  },
  error(message: string, fields?: LogFields): void {
    write("error", message, fields);
  },
};
