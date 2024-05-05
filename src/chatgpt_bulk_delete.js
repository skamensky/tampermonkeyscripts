// ==UserScript==
// @name         bulk_delete_chatgpt
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Add bulk delete UI to chat gpt
// @author       Shmuel Kamensky
// @match        https://chatgpt.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const globalData = {};

  const initGlobalData = () => {
    globalData.token = "";
    globalData.tokenError = false;
    globalData.selectedChats = {};
    globalData.extensionOutdated = false;
  };



  const checkBoxHandler = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // hack. Without preventDefault each click of the checkbox reloads the page on firefox. I never discovered why.
    // When preventing default the checkbox state does not persist to the DOM
    // after the user clicks. We need to manually set the DOM state. However, doing it directly
    // is rolled back by the browser. So we do it via setTimeout to make it work.
    setTimeout(()=>{
      e.target.checked=!e.target.checked;
    },1)

    const liElement = e.target.closest("li");
    const keys = Object.keys(liElement);
    let chatObj = {};
    for (const key in keys) {
        if (keys[key].includes("reactProps")) {
        const propsKey = keys[key];
        if (liElement[propsKey].children && liElement[propsKey].children.props) {
          if(!liElement[propsKey].children.props.conversation){
            // the frontend has changed since we last updated this script. Make it clear that the extension does not work by disabling the checkbox.
            e.target.checked = false;
            e.target.disabled = true;
            e.target.style.opacity = 0.5;

            // TODO mark all checkboxes as disabled
            globalData.extensionOutdated = true;
            return;
          }

          const chatData = liElement[propsKey].children.props.conversation;
          const textContent = chatData.title;
          const chatId = chatData.id;
          chatObj = {
            id: chatId,
            text: textContent,
            projectionId: liElement.dataset.projectionId,
          };
        }
      }
    }
    if (chatObj.id) {
      if (e.target.checked) {
        globalData.selectedChats[chatObj.id] = chatObj;
      } else {
        delete globalData.selectedChats[chatObj.id];
      }
    }
  };

  const addCheckboxesToChatsIfNeeded = () => {
    // is a chat item and doesn't already have a checkbox
    const chats = document.querySelectorAll(
      'nav li:not([data-projection-id=""]):not(.customCheckbox)'
    );
    chats.forEach((chat) => {
      if (chat.querySelector(".customCheckbox")) {
        return;
      }
      const inputElement = document.createElement("input");
      inputElement.setAttribute("type", "checkbox");
      inputElement.setAttribute("class", "customCheckbox");
      inputElement.onclick = checkBoxHandler;
      chat.querySelector("a").insertAdjacentElement("afterbegin", inputElement);
    });
  };
  const closeDialog = () => {
    const dialogElement = document.getElementById("customDeleteDialogModal");
    dialogElement.remove();
    const inputs = document.querySelectorAll(".customCheckbox");
    inputs.forEach((input) => {
      input.disabled = false;
    });
  };

  const getSecChUaString = () => {
    if (navigator.userAgentData && navigator.userAgentData.brands) {
      return navigator.userAgentData.brands
        .map((brand) => {
          return `"${brand.brand}";v="${brand.version}"`;
        })
        .join(", ");
    } else {
      // fallback
      return '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"';
    }
  };

  const getPlatform = () => {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      return navigator.userAgentData.platform;
    } else {
      return `"Linux"`;
    }
  };

  const getToken = () => {
    //https://chatgpt.com/api/auth/session
    return fetch("https://chatgpt.com/api/auth/session", {
      headers: {
        accept: "*/*",
        "accept-language": "en-US",
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
        "sec-ch-ua": getSecChUaString(),
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": getPlatform(),
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      referrer: "https://chatgpt.com/",
      referrerPolicy: "same-origin",
    })
      .then((res) => res.json())
      .then((res) => {
        globalData.token = res.accessToken;
        return res.accessToken;
      })
      .catch((err) => {
        console.log(err);
        globalData.tokenError = true;
      });
  };

  const doDelete = (chatId) => {
    return fetch(`https://chatgpt.com/backend-api/conversation/${chatId}`, {
      headers: {
        accept: "*/*",
        "accept-language": "en-US",
        authorization: `Bearer ${globalData.token}`,
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
        "sec-ch-ua": getSecChUaString(),
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": getPlatform(),
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
      },
      referrer: `https://chatgpt.com/c/${chatId}`,
      referrerPolicy: "same-origin",
      body: '{"is_visible":false}',
      method: "PATCH",
      mode: "cors",
      credentials: "include",
    }).then((res) => res.json());
  };

  const setDialogError = (error) => {
    const errorDiv = document.getElementById("customErrorDiv");
    errorDiv.innerHTML = `<span style="color:red;">${error}</span>`;
  };

  const addBulkDeleteButton = () => {
    const html = `
        <div id="customOpenBulkDeleteDialog" class="mb-1 flex flex-row gap-2">
          <span class="" data-state="closed">
              <a
                  class="flex px-3 min-h-[44px] py-1 gap-3 transition-colors duration-200 dark:text-white cursor-pointer text-sm rounded-md border dark:border-white/20 gizmo:min-h-0 hover:bg-gray-500/10 h-11 gizmo:h-10 gizmo:rounded-lg gizmo:border-[rgba(0,0,0,0.1)] w-11 flex-shrink-0 items-center justify-center bg-white dark:bg-transparent">
                  <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round"
                      stroke-linejoin="round" class="icon-sm" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  <span
                      style="position: absolute; border: 0px; width: 1px; height: 1px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; overflow-wrap: normal;">Bulk Delete Chats</span>
              </a>
          </span>
      </div>
    `;
    document.querySelector('nav').querySelector('div').insertAdjacentHTML("afterend", html);
    document.getElementById("customOpenBulkDeleteDialog").onclick = showDeleteDialog;

  };

  const deleteSelectedChats = () => {
    const selectedChatIds = Object.keys(globalData.selectedChats);
    const doDeleteLocal = (chatId) => {
      const dialogChatElement = document.getElementById(`custom${chatId}`);
      return doDelete(chatId)
        .then((res) => {
          if (res.success || res.success === false) {

            // remove from chats
            const chatElement = document.querySelector(
              `li[data-projection-id="${globalData.selectedChats[chatId].projectionId}"]`
            );

            // removing the elements breaks the react client state. We'll offer to do a page refresh instead.
            // chatElement.closest("li").remove();

            // keep globalData in sync
            delete globalData.selectedChats[chatId];

            // strike through in dialog box and green
            dialogChatElement.innerHTML = `<s>${dialogChatElement.innerHTML}</s>`;
            dialogChatElement.style.color = "green";
          } else {
            dialogChatElement.innerHTML = `<span style="color:red;">Error deleting ${dialogChatElement.innerHTML}</span>`;
            console.log("failure or unexpected response", res);
          }
        })
        .catch((err) => {
          console.log("unexpected doDelete failure", err);
          dialogChatElement.innerHTML = `<span style="color:red;">Error deleting ${dialogChatElement.innerHTML}</span>`;
        });
    };
    const deletePromises = selectedChatIds.map((chatId, index) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(doDeleteLocal(chatId));
        }, 100 * index);
      });
    });

    const done = () => {
      const dialogElement = document.getElementById("customDeleteDialog");
      dialogElement.querySelector(".customCancelButton").innerHTML = "Close";
      dialogElement.querySelector(".customDeleteButton").disabled = true;

      const refreshPageButton = document.createElement("button");
      refreshPageButton.innerHTML = `<button class="btn relative btn-neutral customCancelButton" as="button"><div class="flex w-full gap-2 items-center justify-center">Refresh Page</div></button>`
      refreshPageButton.onclick = () => {
        window.location='https://chatgpt.com/';
        window.location.reload();
      }
      dialogElement.querySelector("#customBulkDeleteButtons").appendChild(refreshPageButton);
    };
    return Promise.all(deletePromises)
      .then(() => {
        done();
      })
      .catch((err) => {
        console.log(err);
        done();
        setDialogError("Error deleting chats. Please try again");
      });
  };

  const showDeleteDialog = () => {
    // disable inputs
    const inputs = document.querySelectorAll(".customCheckbox");
    inputs.forEach((input) => {
      input.disabled = true;
    });
    const dialogElement = document.createElement("div");

    dialogElement.setAttribute("id", "customDeleteDialog");
    let message = "";
    if (Object.keys(globalData.selectedChats).length === 0) {
      message = "No chats selected";
    } else {
      message = "This will delete the selected chats. Are you sure you want to delete the selected chats?";
    }
    dialogElement.innerHTML = `
    <div role="dialog" id="radix-:r1t:" aria-describedby="radix-:r1v:" aria-labelledby="radix-:r1u:" data-state="open" class="relative col-auto col-start-2 row-auto row-start-2 w-full rounded-lg text-left shadow-xl transition-all left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 max-w-md" tabindex="-1" style="pointer-events: auto;"><div class="px-4 pb-4 pt-5 sm:p-6 flex items-center justify-between border-b border-black/10 dark:border-white/10"><div class="flex"><div class="flex items-center"><div class="flex flex-col gap-1 text-center sm:text-left"><h2 id="radix-:r1u:" as="h3" class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200">Delete chat?</h2></div></div></div></div><div class="p-4 sm:p-6 sm:pt-4">
    ${message}
    <div id="customErrorDiv"></div>
    <br>
    {SELECTED_CHATS}
    <div class="mt-5 sm:mt-4" id="customBulkDeleteButtons"><div class="mt-5 flex flex-col gap-3 sm:mt-4 sm:flex-row-reverse"><button class="btn relative btn-danger customDeleteButton" as="button"><div class="flex w-full gap-2 items-center justify-center">Delete</div></button><button class="btn relative btn-neutral customCancelButton" as="button"><div class="flex w-full gap-2 items-center justify-center">Cancel</div></button></div></div></div></div>
    `;

    const formattedChatHTML = Object.values(globalData.selectedChats).map(
      (chat) => {
        return `
        <span id="custom${chat.id}"><strong>${chat.text}</strong></span>
        `;
      }
    );

    dialogElement.innerHTML = dialogElement.innerHTML.replace(
      "{SELECTED_CHATS}",
      formattedChatHTML.join("<br>")
    );

    const deleteSelectedChatsLocal = () => {
      if (!globalData.token) {
        return getToken()
          .then(() => {
            if (globalData.tokenError) {
              setDialogError("Error getting token. Please try again");
              return;
            } else {
              return deleteSelectedChats().catch((err) => {
                console.log(err);
                setDialogError("Error deleting chats. Please try again");
              });
            }
          })
          .catch((err) => {
            console.log(err);
            setDialogError("Error getting token. Please try again");
          });
      }
    };


    const modal = document.createElement("div");
    modal.setAttribute("id", "customDeleteDialogModal");
    modal.appendChild(dialogElement);
    modal.onclick = (event) => {
      event.stopPropagation();
      // if we're clicking within the #customDeleteDialog, don't run closeDialog
      if (event.target.closest("#customDeleteDialog")) {
        return;
      }
      closeDialog();
    }
    modal.style=` display: block; position: fixed; z-index: 1; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);`;
    document.body.insertAdjacentElement("beforebegin", modal);
    dialogElement.querySelector(".customDeleteButton").onclick = deleteSelectedChatsLocal;
    dialogElement.querySelector(".customCancelButton").onclick = closeDialog;
  };

  const initializeIfNeeded = () => {
    if(!document.getElementById("customOpenBulkDeleteDialog")){
      initGlobalData();
      addBulkDeleteButton();
    }
      addCheckboxesToChatsIfNeeded();

  };

  const ready = ()=>{
    return document.querySelector('nav li');
  }

  setInterval(() => {
    if (ready()) {
      initializeIfNeeded();
    }
  }, 200);
})();
