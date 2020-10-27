// ==UserScript==
// @name         Redirect From S3 URI to S3 URL
// @namespace    shmuelkamensky
// @version      0.1
// @description  Redirects you from pasting an S3 URI into the address box to the S3 console (assumes your search engine is google)
// @author       Shmuel Kamensky
// @match        https://www.google.com/search?q=s3%3A%2F%2F*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.querySelectorAll('style')[0].remove()
    const s3URLPath = decodeURIComponent(window.location.search.split('&')[0].replace('?q=','')).replace('s3://','');

//    //guess that if the end of the URI has a period or doesn't have a slash, it's an object.
//    const isObject = s3URLPath.split('/').reverse().filter(i=>i!="")[0].includes('.')||!s3URLPath.endsWith('/');

    // guess that if the end of the URI doesn't have a slash, it's an object.
    const isObject = !s3URLPath.endsWith('/');

    const bucketOrObject = isObject?'object':'buckets';
    const fullURL = "https://s3.console.aws.amazon.com/s3/"+bucketOrObject+"/"+s3URLPath;
    document.body.innerHTML="<h1> Redirecting to <br>" + fullURL +"</h1>";
    window.location.href = fullURL;


})();