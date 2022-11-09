// ==UserScript==
// @name        bitbucket-pullrequest-reviewed-button
// @description Reviewed Button in Bitbucket Cloud.
// @namespace   http://dirkheinke.de
// @include     https://bitbucket.org/*/pull-requests/*
// @version     1.0.0
// @author      Dirk Heinke
// @license     MIT
// @grant       none
// ==/UserScript==

/*
MIT License

Copyright (c) 2020 cvzi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/* globals React, ReactDOM */
(function () {
    'use strict';

    var FileState;
    (function (FileState) {
        FileState[FileState["NEW"] = 0] = "NEW";
        FileState[FileState["OK"] = 1] = "OK";
        FileState[FileState["UNCLEAR"] = 2] = "UNCLEAR";
    })(FileState || (FileState = {}));
    class BbPrLocalStorage {
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
        static getPRFileState(prPath, fileId) {
            let storedStateString = window.localStorage.getItem("BbPr_" + prPath);
            const storedState = JSON.parse(storedStateString) ?? {};
            return storedState[fileId] ?? FileState.NEW;
        }
        static setPRFileState(prPath, fileId, state) {
            let storedStateString = window.localStorage.getItem("BbPr_" + prPath);
            const storedState = JSON.parse(storedStateString) ?? {};
            storedState[fileId] = state;
            storedState.last_changed = Date.now();
            window.localStorage.setItem("BbPr_" + prPath, JSON.stringify(storedState));
        }
    }

    class BbPrFileReviewed {
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
        domChanged(mutationsList, observer) {
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
        removeButtonFromCodeBlock(block) {
            block.querySelectorAll(".BbPrButton").forEach((button) => {
                button.remove();
            });
        }
        addButtonToCodeBlock(block) {
            const fileId = this.getFileIdFromCodeBlock(block);
            const state = BbPrLocalStorage.getPRFileState(window.location.pathname, fileId);
            this.addButtonToBlock(block, state, fileId);
        }
        addButtonToBlock(block, state, fileId) {
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
        getButtonText(state) {
            switch (state) {
                case FileState.NEW:
                    return "NEW";
                case FileState.OK:
                    return "OK";
                case FileState.UNCLEAR:
                    return "??";
            }
        }
        getFileIdFromCodeBlock(block) {
            return block.querySelector("[data-qa='bk-filepath']")
                .innerText;
        }
        findAddedCodeBlocks(mutation) {
            const codeBlockList = [];
            mutation.addedNodes.forEach((added) => {
                if (added instanceof HTMLElement) {
                    const headers = added.querySelectorAll("[data-qa='bk-file__header']");
                    codeBlockList.push(...Array.from(headers));
                }
            });
            return codeBlockList;
        }
        findChangedCodeBlocks(mutation) {
            const codeBlockList = [];
            if (mutation.target instanceof HTMLElement) {
                const qaData = mutation.target.attributes.getNamedItem("data-qa");
                if (qaData?.value === "pr-diff-file-styles") {
                    const headers = mutation.target.querySelectorAll("[data-qa='bk-file__header']");
                    codeBlockList.push(...Array.from(headers));
                }
            }
            return codeBlockList;
        }
        styleElement(element, state) {
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

    (function () {

      new BbPrFileReviewed();
    })();

})();
//# sourceMappingURL=bundle.user.js.map
