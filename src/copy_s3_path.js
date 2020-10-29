// ==UserScript==
// @name         Copy S3 Path
// @namespace    shmuelkamensky
// @version      0.1
// @description  Adds a button to S3 console to generate and copy a qualified S3 URI
// @author       Shmuel Kamensky
// @match        https://s3.console.aws.amazon.com/s3/*
// @grant        none
// ==/UserScript==


window.lastLocationHref="";

const addCopyButton = ()=>{

	if(document.querySelector('#copyPathButton')!=null){
		if(window.lastLocationHref!=window.location.href){
			window.lastLocationHref=window.location.href;
			window.copyPath = ()=>{
			const keyComponent = window.location.href.replace('https://s3.console.aws.amazon.com/s3/','').replace('buckets/','').replace('object/','')
			const s3Path = 's3://' + keyComponent.substring(0,keyComponent.indexOf('?'));
			document.body.insertAdjacentHTML('beforeend','<textarea id="s3pathcopy">' +s3Path+ '</textarea>');
			document.getElementById('s3pathcopy').select();
			document.execCommand("copy");
			document.getElementById('s3pathcopy').remove();
			}
		document.querySelector('awsui-breadcrumb-group').insertAdjacentHTML('beforeend','<br><button id="copyPathButton" onClick="copyPath()">Copy Path</button>');
	    }
	}
}




setInterval(addCopyButton,100);
window.onload = (event) => {
addCopyButton()
};

