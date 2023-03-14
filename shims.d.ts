declare global {
  // eslint-disable-next-line no-unused-vars
  interface Console {
    // https://developer.chrome.com/blog/devtools-modern-web-debugging/#linked-stack-traces
    createTask(name: string): { run: <T extends () => any>(function_: T) => ReturnType<T> }
  }
}

export {};
