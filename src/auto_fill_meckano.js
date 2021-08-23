// ==UserScript==
// @name         Meckano Auto Fill
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto fille meckano
// @author       Shmuel Kamensky/Ali Asadi
// @match        https://app.meckano.co.il/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    const REPORT_TABLE_ID = "freeReporting-dialog";
    const SHOW_REPORT_BUTTON_SELECTOR = ".export.free-reporting";
    const MAIN_VIEW_ID = "mainview";
    window.sfly_auto_data = {
      status: null,
    };
    const attachOurButton = () => {
      showReportButton = document.querySelector(SHOW_REPORT_BUTTON_SELECTOR);
      if (showReportButton == null) {
        return;
      } else if (document.getElementById("sfly_selectEnd") !== null) {
        return;
      }
  
      const hours = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23,
      ].map((num) => {
        let numS = String(num);
        if (numS.length == 1) {
          numS = "0" + numS;
        }
        return `${numS}:00`;
      });
  
      const hourOptions = hours
        .map((h) => {
          return `<option value="${h}">${h}</option>`;
        })
        .join("\n");
  
      const mainView = document.getElementById(MAIN_VIEW_ID);
      const ourButton = document.createElement("button");
  
      const labelStart = document.createElement("label");
      labelStart.for = "sfly_selectStart";
      labelStart.innerHTML = "Choose a start time";
      const selectStart = document.createElement("select");
      selectStart.id = "sfly_selectStart";
      selectStart.name = "sfly_selectStart";
      selectStart.innerHTML = hourOptions;
  
      const labelEnd = document.createElement("label");
      labelEnd.for = "sfly_selectEnd";
      labelEnd.innerHTML = "Choose an end time";
      const selectEnd = document.createElement("select");
      selectEnd.id = "sfly_selectEnd";
      selectEnd.name = "sfly_selectEnd";
      selectEnd.innerHTML = hourOptions;
  
      ourButton.onclick = () => {
        //reset state in case the user wants to make an additional change
        window.sfly_auto_data.status = null;
        document.querySelector(SHOW_REPORT_BUTTON_SELECTOR).click();
      };
      ourButton.innerHTML = "Click to fill Meckano for shown dates";
      ourButton.style.color = "white";
      ourButton.style.background = "blue";
  
      mainView.insertBefore(labelStart, mainView.firstChild);
      mainView.insertBefore(selectStart, mainView.firstChild);
      //for some reason this only works after the element is applied to the DOM
      document.getElementById(selectStart.id).value = "09:00";
  
      mainView.insertBefore(labelEnd, mainView.firstChild);
      mainView.insertBefore(selectEnd, mainView.firstChild);
      document.getElementById(selectEnd.id).value = "19:00";
  
      mainView.insertBefore(ourButton, mainView.firstChild);
  
      attachTableObserver();
  
      // they sometimes rerender the main view. Let's not clearInterval
      //clearInterval(attachOurButtonInterval);
    };
  
    const attachOurButtonInterval = setInterval(attachOurButton, 100);
  
    const handleTableHidden = () => {
      if (window.sfly_auto_data.status == "cleared") {
        document.querySelector(SHOW_REPORT_BUTTON_SELECTOR).click();
      }
    };
  
    const showMessageOnReportBox = (message) => {
      const reportTable = document.getElementById(REPORT_TABLE_ID);
      const ourMessageId = "sfly_report_message";
      let ourMessage = document.createElement("div");
      if (document.getElementById(ourMessageId) != null) {
        ourMessage = document.getElementById(ourMessageId);
      }
  
      ourMessage.id = ourMessageId;
      ourMessage.innerHTML = message;
      ourMessage.style.background = "blue";
      ourMessage.style.color = "white";
      reportTable.insertBefore(ourMessage, reportTable.firstChild);
    };
  
    const handleTableShown = () => {
      if (window.sfly_auto_data.status == null) {
        showMessageOnReportBox("...Clearing previous values");
        window.sfly_auto_data.status = "cleared";
        clearTableHours();
      } else if (window.sfly_auto_data.status == "cleared") {
        window.sfly_auto_data.status = "populated";
        showMessageOnReportBox("...Populating table with set values");
        populateWithHours();
      } else {
        showMessageOnReportBox(
          `Error: Table shown but table state is ${window.sfly_auto_data.status}`
        );
      }
    };
  
    const clearTableHours = () => {
      const table = document.querySelector("table.hours-report");
      const tableRows = table.querySelectorAll("tr");
      const saveButton = document.querySelector(
        ".button-refresh-data.update-freeReporting"
      );
  
      for (let i = 1; i < tableRows.length; i++) {
        const row = tableRows[i];
        const checkInInput = row.querySelector("input.checkIn");
        const checkOutInput = row.querySelector("input.checkOut");
  
        checkInInput.value = "";
        checkOutInput.value = "";
      }
      saveButton.click();
    };
  
    const populateWithHours = () => {
      const table = document.querySelector("table.hours-report");
      const tableRows = table.querySelectorAll("tr");
      const saveButton = document.querySelector(
        ".button-refresh-data.update-freeReporting"
      );
  
      for (let i = 1; i < tableRows.length; i++) {
        const row = tableRows[i];
        const dateText = row.querySelector("span.dateText");
        const checkInInput = row.querySelector("input.checkIn");
        const checkOutInput = row.querySelector("input.checkOut");
        const isWeekend = dateText.innerText.match(/[וש]/);
        const isHoliday =
          row.querySelector(".specialDayDescription").innerText == "חג";
  
        if (!isWeekend && !isHoliday) {
          checkInInput.value = document.getElementById("sfly_selectStart").value;
          checkOutInput.value = document.getElementById("sfly_selectEnd").value;
        }
      }
      saveButton.click();
    };
  
    const reportTableObserver = (mutationList, observer) => {
      const styleChange = mutationList.filter(
        (m) => m.type == "attributes" && m.attributeName == "style"
      );
      if (!styleChange.length) {
        return;
      }
      const isHidden = styleChange[0].target.style.display == "none";
      if (isHidden) {
        handleTableHidden();
      } else {
        handleTableShown();
      }
    };
  
    const attachTableObserver = () => {
      const targetNode = document.getElementById(REPORT_TABLE_ID);
      const observerOptions = {
        childList: false,
        attributes: true,
        subtree: false,
      };
      const observer = new MutationObserver(reportTableObserver);
      observer.observe(targetNode, observerOptions);
    };
  })();
  