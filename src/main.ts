import { BbPrLocalStorage, FileState } from "./localStorage";

export class BbPrFileReviewed {
  constructor() {
    console.log("Starting BbPrFileReviewed");
    BbPrLocalStorage.clearOld();

    const body = document.documentElement || document.body;
    const observer = new MutationObserver(this.domChanged.bind(this));
    observer.observe(body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
  }

  domChanged(mutationsList: MutationRecord[], observer: MutationObserver) {
    for (const mutation of mutationsList) {
      const addedCodeBlocks = this.findAddedCodeBlocks(mutation);
      addedCodeBlocks.forEach((block) => {
        this.addButtonToCodeBlock(block);
      });
      const changedCodeBlocks = this.findChangedCodeBlocks(mutation);
      changedCodeBlocks.forEach((block) => {
        this.removeButtonFromCodeBlock(block);
        this.addButtonToCodeBlock(block);
      });
    }
  }

  private removeButtonFromCodeBlock(block: HTMLElement) {
    block.querySelectorAll<HTMLElement>(".BbPrButton").forEach((button) => {
      button.remove();
    });
  }

  private addButtonToCodeBlock(block: HTMLElement) {
    const fileId = this.getFileIdFromCodeBlock(block);
    const state = BbPrLocalStorage.getPRFileState(
      window.location.pathname,
      fileId
    );
    this.addButtonToBlock(block, state, fileId);
  }

  private addButtonToBlock(
    block: HTMLElement,
    state: FileState,
    fileId: string
  ) {
    let stateButton = document.createElement("div");
    stateButton.classList.add("BbPrButton");
    stateButton.style.width = "50px";
    stateButton.style.textAlign = "center";
    stateButton.style.userSelect = "none";

    stateButton.innerText = this.getButtonText(state);
    this.styleElement(stateButton, state);
    block.append(stateButton);

    stateButton.addEventListener("click", (e) => {
      e.stopPropagation();
      switch (state) {
        case FileState.OK:
          state = FileState.UNCLEAR;
          break;
        case FileState.UNCLEAR:
          state = FileState.NEW;
          break;
        case FileState.NEW:
        default:
          state = FileState.OK;
          break;
      }
      stateButton.innerText = this.getButtonText(state);
      this.styleElement(stateButton, state);
      BbPrLocalStorage.setPRFileState(window.location.pathname, fileId, state);
    });
  }

  private getButtonText(state: FileState) {
    switch (state) {
      case FileState.NEW:
        return "NEW";
      case FileState.OK:
        return "OK";
      case FileState.UNCLEAR:
        return "??";
    }
  }

  private getFileIdFromCodeBlock(block: HTMLElement): string {
    return block.querySelector<HTMLElement>("[data-qa='bk-filepath']")
      .innerText;
  }

  private findAddedCodeBlocks(mutation: MutationRecord) {
    const codeBlockList: HTMLElement[] = [];

    mutation.addedNodes.forEach((added) => {
      if (added instanceof HTMLElement) {
        const headers = added.querySelectorAll<HTMLElement>(
          "[data-qa='bk-file__header']"
        );
        codeBlockList.push(...Array.from(headers));
      }
    });
    return codeBlockList;
  }

  private findChangedCodeBlocks(mutation: MutationRecord) {
    const codeBlockList: HTMLElement[] = [];

    if (mutation.target instanceof HTMLElement) {
      const qaData = mutation.target.attributes.getNamedItem("data-qa");

      if (qaData?.value === "pr-diff-file-styles") {
        const headers = mutation.target.querySelectorAll<HTMLElement>(
          "[data-qa='bk-file__header']"
        );
        codeBlockList.push(...Array.from(headers));
      }
    }
    return codeBlockList;
  }

  private styleElement(element: HTMLElement, state: FileState) {
    switch (state) {
      case FileState.OK:
        element.style.backgroundColor = "green";
        break;
      case FileState.UNCLEAR:
        element.style.backgroundColor = "red";
        break;
      case FileState.NEW:
      default:
        element.style.backgroundColor = "transparent";
        break;
    }
  }
}
