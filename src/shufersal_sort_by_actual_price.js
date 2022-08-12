// ==UserScript==
// @name         shufersal_sort_by_actual_price
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Side step shufersal upsell by giving transparency on actual pricing
// @author       You
// @match        https://www.shufersal.co.il/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function parsePricePerItem(item) {
        //remove newlines
        item = item.replace(/\n/g, "");
        //remove ש"ח ל-
        item = item.replace(/ש"ח ל-/g, "");
        //trim spaces
        item = item.trim();
        //remove duplicate spaces
        item = item.replace(/\s+/g, " ");
        const components = item.split(" ");
        // the components look like this: [2.48, '100', 'גרם']
        let quantity = 0;
        const price = Number(components[0]);
        const unit = components[2];
      
        if (["גרם", 'מ"ל'].includes(unit)) {
          quantity = Number(components[1]);
        } else if (['ק"ג', "ליטר", "ל'"].includes(unit)) {
          quantity = Number(components[1]) * 1000;
        } else if (unit == "יחידה") {
          quantity = 1;
        } else {
          // we don't know what this is. Make the divisor low so it pops to the top
          quantity = 0.01;
        }
        const pricePerGram = price / quantity;
        return { quantity, price: Number(price), pricePerGram };
      }
      
      function compare(a, b) {
        if (a.cleanPrice.pricePerGram < b.cleanPrice.pricePerGram) {
          return -1;
        }
        if (a.cleanPrice.pricePerGram > b.cleanPrice.pricePerGram) {
          return 1;
        }
        return 0;
      }
      
      function scrollNTimes(n) {
        window.scrollTo(0, document.body.scrollHeight);
        for (i = 0; i < n; i++) {
          setTimeout(() => window.scrollTo(0, document.body.scrollHeight), i * 2000);
        }
        setTimeout(() => {
          window.scrollTo(0, document.body.scrollHeight);
          reorder();
        }, n * 2000);
      }
      
      function reorder() {
        const items = document.querySelectorAll("li .miglog-prod");
        const parent = items[0].parentElement;
      
        const itemAndCleanPrice = Array.from(items).map((item) => {
          const dirtyPrice = item.querySelector(".smallText").textContent;
          const cleanPrice = parsePricePerItem(dirtyPrice);
          return { item, cleanPrice };
        });
        const itemsSorted = itemAndCleanPrice
          .sort(compare)
          .map((itemAndPrice) => itemAndPrice.item);
        parent.replaceChildren(...itemsSorted);
        window.scrollTo({ top: 0, behavior: "smooth" });
        alert("DONE");
      }
      
      function addStyle(styleString) {
        const style = document.createElement("style");
        style.textContent = styleString;
        document.head.append(style);
      }
      
      function addButton() {
        let sibling = document.querySelector(".wrapperMainHeaderTop").children[0];
        let button = document.createElement("button");
        button.textContent = "Order items by price per unit";
        button.id = "reorderByPriceButton";
        button.addEventListener("click", () => scrollNTimes(4));
        sibling.parentNode.insertBefore(button, sibling);
        console.log(button);
      }
      
      addStyle(`
      #reorderByPriceButton {
          background-color: #4CAF50 !important;
      
          border: none !important; 
          color: white !important; 
          padding: 15px 32px !important; 
          text-align: center !important;  
          text-decoration: none !important;  
          display: block !important;
          width: 100% !important;
          font-size: 16px !important;  
          margin: 4px 2px !important; 
          cursor: pointer !important;  
          border-color: #599a68 !important;
        }
      `);
      
      setInterval(() => {
        if (document.getElementById("reorderByPriceButton") == null) {
          addButton();
        }
      }, 200);    
})();
