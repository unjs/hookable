declare global {
  interface Console {
    // https://developer.chrome.com/blog/devtools-modern-web-debugging/#linked-stack-traces
    createTask(name: string): { run: <T extends () => any>(function_: T) => ReturnType<T> }
  }
}

export {};
