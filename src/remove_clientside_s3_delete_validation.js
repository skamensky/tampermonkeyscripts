// ==UserScript==
// @name         remove_clientside_s3_delete_validation
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Remove foolish AWS child lock
// @author       You
// @match        https://s3.console.aws.amazon.com/s3/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setInterval(()=>{
        const results = document.body.querySelectorAll('awsui-button[class*="delete"] button');
        if(results.length!=0){
            results[1].attributes.removeNamedItem('disabled')
            results[1].classList.remove('awsui-button-disabled')
        }

    },500);

})();
