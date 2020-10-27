// ==UserScript==
// @name         Reload Logs
// @namespace    shmuelkamensky
// @version      0.1
// @description  Presses the reload button in airflow until the initial load of the log
// @author       You
// @match        */admin/airflow/log*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setTimeout(() => {
        window.scrollBy({
            top: document.body.scrollHeight,
            left: 0,
            //      behavior: 'smooth'


        });
    }, 2000)

    setTimeout(() => {

        if(document.querySelector('pre')===null){
            location.reload();
        }
        
    }, 3000)

})();