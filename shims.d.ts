declare global {
  // eslint-disable-next-line no-unused-vars
  interface Console {
    createTask(name: string): { run: <T extends () => any>(function_: T) => ReturnType<T> }
  }
}

export {};
