// ==UserScript==
// @name         shufersal_sort_by_actual_price
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Side step shufersal upsell by giving transparency on actual pricing
// @author       Shmuel Kamensky
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
      
      function getPersistentValue(key){
        let data=JSON.parse(localStorage.getItem('shufersal_sort_by_actual_price'));
        if(data==null){
            data = {};
        } 
        return data[key];
      }

      function setPersistentValue(key,value){
        let data=JSON.parse(localStorage.getItem('shufersal_sort_by_actual_price'));
        if(data==null){
            data = {};
        }
          data[key]=value;
          localStorage.setItem('shufersal_sort_by_actual_price', JSON.stringify(data));
      }

      function scrollUntilEnd() {
        window.scrollTo(0, document.body.scrollHeight);
        const intervalId=setInterval(()=>{

            const lastNewScrollHeight = getPersistentValue('lastNewScrollHeight');
            const lastScrollTime = new Date(getPersistentValue('lastScrollTime'));

            window.scrollTo(0, document.body.scrollHeight);            
            const currentScrollHeight=document.body.scrollHeight;
            const now =new Date();
            const secondsSinceLastScroll = (now - lastScrollTime)/1000;

            if(lastNewScrollHeight!=currentScrollHeight){
                setPersistentValue('lastNewScrollHeight',document.body.scrollHeight);
                setPersistentValue('lastScrollTime',now.toJSON());
            }
            else if (secondsSinceLastScroll>2){
                clearInterval(Number(getPersistentValue('intervalId')));
                reorder();
            }
        },100)
        setPersistentValue('intervalId',intervalId);

        showMessage("Loading all products...");
      }
      
      function reorder() {
          try{
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
            showMessage("Done 😇. You can now enjoy shopping with confidence 🛒!");
          }
        catch(e){
            showMessage("Error 😞. Look at the console additional information.");
            console.trace(e);
        }
      }

      function showMessage(message){
         document.getElementById("reorderByPriceMessage").innerText = message;
      }
      
      function addStyle(styleString) {
        const style = document.createElement("style");
        style.textContent = styleString;
        document.head.append(style);
      }

      function addElement(elem){
        const parent = document.querySelector('.breadCompareRow ');
        const sibling = parent.children[0];
        sibling.parentNode.insertBefore(elem, sibling);
      }
      
      function addButton() {
        const button = document.createElement("button");
        button.textContent = "Order items by price per unit";
        button.id = "reorderByPriceButton";
        button.dir="ltr";
        button.addEventListener("click", () => scrollUntilEnd());
        addElement(button);
      }
      
     function addMessageElem() {
        const message = document.createElement("p");
        message.textContent = "Product reorder message ";
        message.id = "reorderByPriceMessage";
        message.dir="ltr"
        addElement(message);
      }

      function changeParentStyle(){
        addStyle(
            `
            .breadCompareRow {
                flex-flow: row wrap !important;
        `
        )
        
      }
      
      function initialize(){
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

        addStyle(`
        #reorderByPriceMessage {
             font-size: 200% !important;
        }
        `)
        addButton();
        addMessageElem();
      }

      setInterval(() => {
        if (document.getElementById("reorderByPriceButton") == null) {
          initialize()
        }
      }, 200);    
})();
