// ==UserScript==
// @name         Refresh Airflow graph
// @namespace    shmuelkamensky
// @version      0.1
// @description  Refresh graph
// @author       Shmuel Kamensky
// @match        */admin/airflow/graph*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setInterval(()=>{
        document.getElementById('refresh_button').click();
    },1000);
})();