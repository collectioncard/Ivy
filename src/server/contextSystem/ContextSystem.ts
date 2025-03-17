/**
 * ContextSystem is a singleton that holds the context of the play as it progresses.
 */
import { contextElement } from '../Types';
import { getSummary } from './Summarizer';

export class ContextSystem {
  ////**** Singleton Stuff - Don't touch ****////
  private static instance: ContextSystem;
  private constructor() {}

  static getInstance(): ContextSystem {
    if (!ContextSystem.instance) {
      ContextSystem.instance = new ContextSystem();
    }
    return ContextSystem.instance;
  }
  ////**** End Singleton Stuff ****////

  private context: contextElement[] = [];

  private isSummarizing: boolean = false;

  private summarizedContext: string =
    'This is the beginning of time. There is no context here yet...';

  /**
   * Adds a string to the current context.
   * @param context The context to be added.
   */
  addContext(context: string): void {
    this.context.push({
      timestamp: new Date(),
      context: context,
    });

    //TODO Add a proper context queueing system
    if (!this.isSummarizing) {
      this.isSummarizing = true;
      this.summarizeContext().finally(() => {
        this.isSummarizing = false;
        console.log('Latest Context Summary: ', this.summarizedContext);
      });
    }

    console.log('Latest Context: ', this.context);
  }

  /**
   * Sends the full context to a llm to be summarized.
   */
  async summarizeContext(): Promise<void> {
    const fullContext = JSON.stringify(this.context);

    this.summarizedContext = await getSummary(fullContext);
  }

  /**
   * Returns the latest version of the summarized context. There is no guarantee that the summarized context is up to date with the full context.
   */
  getSummarizedContext(): string {
    return this.summarizedContext;
  }

  /**
   * Returns the non-summarized context. If an amount is provided, it will return that many elements from the end of the context.
   * @param amount The number of context elements to return from the end of the context.
   */
  getFullContext(amount?: number): contextElement[] {
    return amount ? this.context.slice(-amount) : this.context;
  }
}
