export enum FileState {
  NEW,
  OK,
  UNCLEAR,
}

export class BbPrLocalStorage {
  static clearOld() {
    const items = { ...localStorage };
    Object.keys(items).forEach((itemName) => {
      if (itemName.startsWith("fs_")) {
        let data = JSON.parse(items[itemName]);
        if (!data.last_changed) {
          return;
        }
        if (Date.now() > data.last_changed + 1000 * 60 * 60 * 24 * 30) {
          localStorage.removeItem(itemName);
        }
      }
    });
  }

  static getPRFileState(prPath: string, fileId: string): FileState {
    let storedStateString = window.localStorage.getItem("BbPr_" + prPath);
    const storedState = JSON.parse(storedStateString) ?? {};
    return storedState[fileId] ?? FileState.NEW;
  }

  static setPRFileState(prPath: string, fileId: string, state: FileState) {
    let storedStateString = window.localStorage.getItem("BbPr_" + prPath);
    const storedState = JSON.parse(storedStateString) ?? {};
    storedState[fileId] = state;
    storedState.last_changed = Date.now();
    window.localStorage.setItem("BbPr_" + prPath, JSON.stringify(storedState));
  }
}
